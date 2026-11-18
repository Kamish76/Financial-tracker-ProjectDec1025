-- Migration 020: Non-Destructive Linked Organization Withholding Sub-Accounts
-- Description: Adds linked_org_id and linked_org_balance to wallet_accounts so users can
--              safely toggle linking a sub-account to an organization's negated businessHeld
--              balance without altering starting_value or existing sub-account data.

ALTER TABLE public.wallet_accounts
  ADD COLUMN IF NOT EXISTS linked_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_org_balance NUMERIC;

CREATE INDEX IF NOT EXISTS idx_wallet_accounts_linked_org
  ON public.wallet_accounts(linked_org_id)
  WHERE linked_org_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_member_business_held(p_org_id UUID, p_user_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN type = 'held_allocate' THEN amount
      WHEN type = 'held_return' THEN -amount
      WHEN funded_by_type = 'business' AND type = 'income' THEN amount
      WHEN funded_by_type = 'business' AND type = 'expense_business' THEN -amount
      ELSE 0
    END
  ), 0)
  FROM public.transactions
  WHERE organization_id = p_org_id
    AND funded_by_user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_member_business_held(UUID, UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_linked_wallet_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  IF NEW.linked_org_id IS NOT NULL THEN
    SELECT owner_id INTO v_owner_id
    FROM public.organizations
    WHERE id = NEW.organization_id;

    IF v_owner_id IS NOT NULL THEN
      NEW.linked_org_balance := -public.get_member_business_held(NEW.linked_org_id, v_owner_id);
    ELSE
      NEW.linked_org_balance := 0;
    END IF;
  ELSE
    NEW.linked_org_balance := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_enforce_linked_wallet_account_balance
  BEFORE INSERT OR UPDATE OF linked_org_id
  ON public.wallet_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_linked_wallet_account_balance();

CREATE OR REPLACE FUNCTION public.sync_linked_wallet_accounts_on_tx()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE public.wallet_accounts wa
    SET linked_org_balance = -public.get_member_business_held(wa.linked_org_id, o.owner_id),
        updated_at = NOW()
    FROM public.organizations o
    WHERE o.id = wa.organization_id
      AND wa.linked_org_id = OLD.organization_id;
  END IF;

  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.organization_id IS DISTINCT FROM OLD.organization_id) THEN
    UPDATE public.wallet_accounts wa
    SET linked_org_balance = -public.get_member_business_held(wa.linked_org_id, o.owner_id),
        updated_at = NOW()
    FROM public.organizations o
    WHERE o.id = wa.organization_id
      AND wa.linked_org_id = NEW.organization_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_linked_wallet_accounts_on_tx
  AFTER INSERT OR UPDATE OR DELETE
  ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_linked_wallet_accounts_on_tx();
