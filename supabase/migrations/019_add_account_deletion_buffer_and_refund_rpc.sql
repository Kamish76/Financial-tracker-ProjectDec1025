-- Migration 019: Account Deletion Buffer and Atomic Financial Procedures
-- Description: Adds a 30-day grace period buffer for user account deletion requests,
--              automated due request purging, an atomic stored procedure for member refunds,
--              and a high-performance organization financial totals aggregate RPC.

-- ============================================================================
-- 1. ACCOUNT DELETION REQUESTS TABLE & BUFFER ARCHITECTURE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Ensure a user can only have one active pending deletion request at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_deletion_per_user
  ON public.account_deletion_requests(user_id)
  WHERE status = 'pending';

-- Index for the daily purge cron runner to quickly identify due deletion requests
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_due
  ON public.account_deletion_requests(scheduled_deletion_at)
  WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Users can view own deletion requests" ON public.account_deletion_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Users can insert own deletion requests" ON public.account_deletion_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Users can update own deletion requests" ON public.account_deletion_requests
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON TABLE public.account_deletion_requests FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE ON TABLE public.account_deletion_requests TO authenticated;
GRANT ALL ON TABLE public.account_deletion_requests TO service_role;

-- ============================================================================
-- 2. DUE ACCOUNT DELETION PROCESSOR (Vercel Daily Cron Runner)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_due_account_deletions()
RETURNS TABLE(deleted_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
  r RECORD;
BEGIN
  FOR r IN 
    SELECT id, user_id FROM public.account_deletion_requests
    WHERE status = 'pending' AND scheduled_deletion_at <= NOW()
  LOOP
    -- 1. Permanently remove user's personal wallet organizations (is_wallet = true)
    DELETE FROM public.organizations 
    WHERE owner_id = r.user_id AND LOWER(TRIM(COALESCE(description, ''))) LIKE '[wallet]%';
    
    -- 2. Soft-deactivate user from any shared business organizations to preserve audit trail
    UPDATE public.organization_members
    SET is_active = false
    WHERE user_id = r.user_id;

    -- 3. Mark deletion request as completed with timestamp
    UPDATE public.account_deletion_requests
    SET status = 'completed', completed_at = NOW()
    WHERE id = r.id;

    v_count := v_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.process_due_account_deletions() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_due_account_deletions() FROM anon;
GRANT EXECUTE ON FUNCTION public.process_due_account_deletions() TO authenticated, service_role;

-- ============================================================================
-- 3. ATOMIC MEMBER REFUND STORED PROCEDURE (AGENTS.md Rule 5)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_member_refund(
  p_org_id UUID,
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contributed NUMERIC := 0;
  v_reimbursed NUMERIC := 0;
  v_outstanding NUMERIC := 0;
  v_reimbursement_id UUID;
  v_tx_id UUID;
BEGIN
  -- 1. Authorization check: caller must be owner or admin if authenticated
  IF auth.uid() IS NOT NULL AND NOT (
    EXISTS (SELECT 1 FROM public.organizations WHERE id = p_org_id AND owner_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = p_org_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin') 
        AND is_active = true
    )
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions to issue refund');
  END IF;

  -- 2. Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Refund amount must be greater than zero');
  END IF;

  -- 3. Pessimistic row locking on organization and member profile to eliminate race conditions (AGENTS.md Rule 5)
  PERFORM 1 FROM public.organizations WHERE id = p_org_id FOR UPDATE;
  PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  -- 4. Calculate current reimbursable contributions
  SELECT COALESCE(SUM(amount), 0) INTO v_contributed
  FROM public.transactions
  WHERE organization_id = p_org_id
    AND funded_by_user_id = p_user_id
    AND funded_by_type = 'personal'
    AND type = 'expense_personal';

  SELECT COALESCE(SUM(amount), 0) INTO v_reimbursed
  FROM public.reimbursement_requests
  WHERE organization_id = p_org_id
    AND from_user_id = p_user_id
    AND status = 'paid';

  v_outstanding := GREATEST(v_contributed - v_reimbursed, 0);

  IF p_amount > v_outstanding THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Amount exceeds outstanding reimbursable balance'
    );
  END IF;

  -- 5. Atomically insert reimbursement request marked as paid
  INSERT INTO public.reimbursement_requests (
    organization_id, from_user_id, amount, status, approval_required, notes
  ) VALUES (
    p_org_id, p_user_id, p_amount, 'paid', false, p_description
  ) RETURNING id INTO v_reimbursement_id;

  -- 6. Atomically insert ledger deduction transaction
  INSERT INTO public.transactions (
    organization_id, user_id, type, amount, description, category,
    occurred_at, funded_by_type, funded_by_user_id, updated_by_user_id, is_initial
  ) VALUES (
    p_org_id, p_user_id, 'held_return', p_amount,
    COALESCE(p_description, 'Refund withdrawal'), 'Refund',
    NOW(), 'business', p_user_id, p_user_id, false
  ) RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'reimbursement_id', v_reimbursement_id,
    'transaction_id', v_tx_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_member_refund(UUID, UUID, NUMERIC, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_member_refund(UUID, UUID, NUMERIC, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.process_member_refund(UUID, UUID, NUMERIC, TEXT) TO authenticated, service_role;

-- ============================================================================
-- 4. DATABASE-LEVEL FINANCIAL TOTALS AGGREGATION RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_organization_financial_totals(p_org_id UUID)
RETURNS TABLE (
  total_income NUMERIC,
  total_expenses_business NUMERIC,
  total_expenses_personal NUMERIC,
  expenses_capital NUMERIC,
  total_refund_withdrawals NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense_business' THEN t.amount ELSE 0 END), 0) AS total_expenses_business,
    COALESCE(SUM(CASE WHEN t.type = 'expense_personal' THEN t.amount ELSE 0 END), 0) AS total_expenses_personal,
    COALESCE(SUM(CASE WHEN TRIM(LOWER(COALESCE(t.category, tc.normalized_name, ''))) = 'capital' THEN t.amount ELSE 0 END), 0) AS expenses_capital,
    COALESCE(SUM(CASE WHEN t.type = 'held_return' AND TRIM(LOWER(COALESCE(t.category, tc.normalized_name, ''))) = 'refund' THEN t.amount ELSE 0 END), 0) AS total_refund_withdrawals
  FROM public.transactions t
  LEFT JOIN public.transaction_categories tc ON tc.id = t.category_id
  WHERE t.organization_id = p_org_id;
$$;

REVOKE ALL ON FUNCTION public.get_organization_financial_totals(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_organization_financial_totals(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_organization_financial_totals(UUID) TO authenticated, service_role;
