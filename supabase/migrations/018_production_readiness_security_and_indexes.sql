-- Migration 018: Production Readiness Security, Indexing & Integrity Hardening
-- Description: Remediates critical security vulnerabilities (RLS, RPCs), missing composite indexes,
--              foreign key cascading behaviors, non-atomic ownership transfer, and wallet constraints.
-- Affected Areas: organizations, organization_members, transactions, wallet_accounts, keep_alive_logs,
--                 reimbursement_requests, invite_codes, transaction_categories.

-- ============================================================================
-- 1. RLS POLICY HARDENING (SEC-02)
-- ============================================================================

-- 1.1 Drop overly permissive global organization SELECT policy that exposed all organizations
-- and personal wallet metadata to any authenticated user.
DROP POLICY IF EXISTS orgs_select_all_authenticated ON public.organizations;

-- 1.2 Harden orgs_select_member: callers can only SELECT organizations if they are the
-- explicit owner OR an active member verified via secure helper fn_is_org_member.
DROP POLICY IF EXISTS orgs_select_member ON public.organizations;
CREATE POLICY orgs_select_member ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() 
    OR public.fn_is_org_member(id)
  );

-- ============================================================================
-- 2. SECURE RPC FUNCTIONS & AUDIT LOG RESTRICTIONS (SEC-03, SEC-04, SEC-05)
-- ============================================================================

-- 2.1 Harden get_org_member_emails: Enforce caller membership verification and active status
CREATE OR REPLACE FUNCTION public.get_org_member_emails(p_org_id UUID)
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email
  FROM auth.users u
  JOIN public.organization_members om ON om.user_id = u.id
  WHERE om.organization_id = p_org_id
    AND om.is_active = true
    AND (
      auth.role() = 'service_role'
      OR EXISTS (
        SELECT 1 FROM public.organization_members caller
        WHERE caller.organization_id = p_org_id
          AND caller.user_id = auth.uid()
          AND caller.is_active = true
      )
      OR EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = p_org_id
          AND o.owner_id = auth.uid()
      )
    );
$$;

REVOKE ALL ON FUNCTION public.get_org_member_emails(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_org_member_emails(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_org_member_emails(UUID) TO authenticated, service_role;

-- 2.2 Harden deactivate_member: Prevent deactivating organization owners
CREATE OR REPLACE FUNCTION public.deactivate_member(
  p_organization_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Safeguard: Reject deactivation if target user is the organization owner
  IF EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = p_organization_id AND owner_id = p_user_id
  ) THEN
    RETURN FALSE;
  END IF;

  UPDATE public.organization_members
  SET 
    is_active = false,
    deactivated_at = NOW()
  WHERE organization_id = p_organization_id
    AND user_id = p_user_id
    AND role != 'owner'
    AND is_active = true;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_member(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deactivate_member(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.deactivate_member(UUID, UUID) TO authenticated, service_role;

-- 2.3 Restrict keep_alive_logs table access exclusively to service_role
DROP POLICY IF EXISTS "Allow service role to insert keep-alive logs" ON public.keep_alive_logs;
DROP POLICY IF EXISTS "Allow authenticated users to view keep-alive logs" ON public.keep_alive_logs;
REVOKE ALL ON TABLE public.keep_alive_logs FROM authenticated, anon, PUBLIC;
GRANT ALL ON TABLE public.keep_alive_logs TO service_role;

-- 2.4 Resolve TOCTOU race condition in get_or_create_category using ON CONFLICT DO UPDATE
CREATE OR REPLACE FUNCTION public.get_or_create_category(
  p_org_id UUID,
  p_input_name TEXT,
  p_max_distance INT DEFAULT 2
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id UUID;
  v_normalized_input TEXT;
  v_match_id UUID;
  v_min_distance INT;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT (public.fn_is_org_member(p_org_id) OR EXISTS (SELECT 1 FROM public.organizations WHERE id = p_org_id AND owner_id = auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not an active member or owner of this organization';
  END IF;

  -- Normalize input: lowercase, trim, collapse whitespace
  v_normalized_input := LOWER(TRIM(REGEXP_REPLACE(p_input_name, '\s+', ' ', 'g')));
  
  -- Return NULL if empty
  IF v_normalized_input = '' THEN
    RETURN NULL;
  END IF;
  
  -- Exact match check
  SELECT id INTO v_category_id
  FROM public.transaction_categories
  WHERE organization_id = p_org_id
    AND normalized_name = v_normalized_input
  LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    RETURN v_category_id;
  END IF;
  
  -- Fuzzy match: find closest match within distance threshold
  SELECT id, MIN(public.levenshtein_distance(normalized_name, v_normalized_input)) as min_dist
  INTO v_match_id, v_min_distance
  FROM public.transaction_categories
  WHERE organization_id = p_org_id
    AND public.levenshtein_distance(normalized_name, v_normalized_input) <= p_max_distance
  GROUP BY id
  ORDER BY min_dist ASC
  LIMIT 1;
  
  IF v_match_id IS NOT NULL THEN
    -- Found a fuzzy match; record alias if not already present
    UPDATE public.transaction_categories
    SET aliases = CASE
      WHEN NOT (aliases @> ARRAY[v_normalized_input]) THEN array_append(aliases, v_normalized_input)
      ELSE aliases
    END
    WHERE id = v_match_id;
    
    RETURN v_match_id;
  END IF;
  
  -- No match found: create new category atomically with conflict handling
  INSERT INTO public.transaction_categories (organization_id, normalized_name, aliases, is_custom)
  VALUES (p_org_id, v_normalized_input, ARRAY[]::TEXT[], TRUE)
  ON CONFLICT (organization_id, normalized_name) DO UPDATE
    SET updated_at = NOW()
  RETURNING id INTO v_category_id;
  
  RETURN v_category_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_category(UUID, TEXT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_or_create_category(UUID, TEXT, INT) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_category(UUID, TEXT, INT) TO authenticated, service_role;

-- ============================================================================
-- 3. HIGH-CARDINALITY COMPOSITE & FOREIGN KEY INDEXES
-- ============================================================================

-- 3.1 Transaction sorting and pagination indexes
CREATE INDEX IF NOT EXISTS idx_transactions_org_occurred 
  ON public.transactions(organization_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_org_created 
  ON public.transactions(organization_id, created_at DESC);

-- 3.2 Transaction type and category filtering indexes
CREATE INDEX IF NOT EXISTS idx_transactions_org_type 
  ON public.transactions(organization_id, type);

CREATE INDEX IF NOT EXISTS idx_transactions_category_id 
  ON public.transactions(category_id);

-- 3.3 Foreign key indexes on transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user 
  ON public.transactions(user_id);

-- 3.4 Organization owner lookup index
CREATE INDEX IF NOT EXISTS idx_organizations_owner 
  ON public.organizations(owner_id);

-- 3.5 Active wallet sub-accounts index
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_active 
  ON public.wallet_accounts(organization_id, is_active);

-- 3.6 Active organization members index
CREATE INDEX IF NOT EXISTS idx_org_members_user_active 
  ON public.organization_members(user_id, is_active);

-- 3.7 Reimbursement request foreign key & status indexes
CREATE INDEX IF NOT EXISTS idx_reimbursement_requests_to 
  ON public.reimbursement_requests(to_user_id);

CREATE INDEX IF NOT EXISTS idx_reimbursement_requests_tx 
  ON public.reimbursement_requests(transaction_id);

CREATE INDEX IF NOT EXISTS idx_reimbursement_requests_status 
  ON public.reimbursement_requests(organization_id, status);

-- 3.8 Invite code creator index
CREATE INDEX IF NOT EXISTS idx_invite_codes_creator 
  ON public.invite_codes(created_by);

-- ============================================================================
-- 4. SUB-ACCOUNT SAFEGUARDS: FOREIGN KEY RESTRICT (AGENTS.md Rule 2)
-- ============================================================================

-- Ensure transactions cannot be orphaned by sub-account hard deletion.
-- Drops legacy ON DELETE SET NULL foreign keys and replaces them with ON DELETE RESTRICT.
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.wallet_accounts(id) ON DELETE RESTRICT;

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_transfer_to_account_id_fkey;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_transfer_to_account_id_fkey
  FOREIGN KEY (transfer_to_account_id) REFERENCES public.wallet_accounts(id) ON DELETE RESTRICT;

-- ============================================================================
-- 5. ATOMIC PROCEDURE: TRANSFER ORGANIZATION OWNERSHIP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.transfer_organization_ownership(
  p_org_id UUID,
  p_new_owner_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_owner_id UUID;
BEGIN
  -- 1. Lock the organization row and retrieve current owner
  SELECT owner_id INTO v_current_owner_id
  FROM public.organizations
  WHERE id = p_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found.';
  END IF;

  -- 2. Authorization check: caller must be current owner or service_role
  IF auth.role() != 'service_role' AND auth.uid() != v_current_owner_id THEN
    RAISE EXCEPTION 'Only the organization owner can transfer ownership.';
  END IF;

  -- 3. Invariant check: cannot transfer ownership to current owner
  IF v_current_owner_id = p_new_owner_id THEN
    RAISE EXCEPTION 'Target user is already the owner of this organization.';
  END IF;

  -- 4. Invariant check: target recipient must be an active member of the organization
  PERFORM 1 FROM public.organization_members
  WHERE organization_id = p_org_id AND user_id = p_new_owner_id AND is_active = true
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user is not an active member of this organization';
  END IF;

  -- 5. Atomically update organization owner
  UPDATE public.organizations
  SET owner_id = p_new_owner_id
  WHERE id = p_org_id;

  -- 6. Demote current owner to admin in organization_members
  UPDATE public.organization_members
  SET role = 'admin'
  WHERE organization_id = p_org_id AND user_id = v_current_owner_id;

  -- 7. Promote target member to owner in organization_members
  UPDATE public.organization_members
  SET role = 'owner'
  WHERE organization_id = p_org_id AND user_id = p_new_owner_id;
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_organization_ownership(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transfer_organization_ownership(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.transfer_organization_ownership(UUID, UUID) TO authenticated, service_role;

-- ============================================================================
-- 6. INTEGRITY CONSTRAINTS & PARTIAL INDEXES
-- ============================================================================

-- 6.1 Enforce transfer transaction account consistency:
--     - If type is 'transfer', account_id and transfer_to_account_id must both be present and distinct.
--     - If type is not 'transfer', transfer_to_account_id must be NULL.
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS check_transfer_accounts;
ALTER TABLE public.transactions ADD CONSTRAINT check_transfer_accounts
  CHECK (
    (type = 'transfer' AND account_id IS NOT NULL AND transfer_to_account_id IS NOT NULL AND account_id <> transfer_to_account_id)
    OR
    (type <> 'transfer' AND transfer_to_account_id IS NULL)
  );

-- 6.2 Partial unique index to enforce exactly one personal wallet per user
-- Clean up / deduplicate existing personal wallets per owner before indexing:
-- Priority: Retain the wallet with the highest transaction count; if tied, retain the most recently created.
-- For duplicate wallets with zero transactions, safely remove them.
WITH wallet_tx_counts AS (
  SELECT 
    o.id,
    o.owner_id,
    o.created_at,
    COUNT(t.id) AS tx_count
  FROM public.organizations o
  LEFT JOIN public.transactions t ON t.organization_id = o.id
  WHERE o.description LIKE '[wallet]%'
  GROUP BY o.id, o.owner_id, o.created_at
),
ranked_wallets AS (
  SELECT 
    id,
    owner_id,
    tx_count,
    ROW_NUMBER() OVER (
      PARTITION BY owner_id 
      ORDER BY tx_count DESC, created_at DESC
    ) AS rn
  FROM wallet_tx_counts
)
DELETE FROM public.organizations o
USING ranked_wallets r
WHERE o.id = r.id 
  AND r.rn > 1 
  AND r.tx_count = 0;

-- For any remaining duplicate wallets that have recorded transactions,
-- safely archive their marker to preserve all audit records while satisfying the unique index.
WITH wallet_tx_counts AS (
  SELECT 
    o.id,
    o.owner_id,
    o.created_at,
    COUNT(t.id) AS tx_count
  FROM public.organizations o
  LEFT JOIN public.transactions t ON t.organization_id = o.id
  WHERE o.description LIKE '[wallet]%'
  GROUP BY o.id, o.owner_id, o.created_at
),
ranked_wallets AS (
  SELECT 
    id,
    owner_id,
    tx_count,
    ROW_NUMBER() OVER (
      PARTITION BY owner_id 
      ORDER BY tx_count DESC, created_at DESC
    ) AS rn
  FROM wallet_tx_counts
)
UPDATE public.organizations o
SET description = REGEXP_REPLACE(o.description, '^(\s*)\[wallet\]', '\1[archived-wallet]', 'i')
FROM ranked_wallets r
WHERE o.id = r.id 
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_wallet_per_user 
  ON public.organizations(owner_id) 
  WHERE description LIKE '[wallet]%';

