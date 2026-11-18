-- Migration 021: Auto-Mirror Organization <-> Personal Wallet Sub-Account Transfers
-- Description: Adds mirrored_from_tx_id (ON DELETE CASCADE) to public.transactions and an
--              AFTER UPDATE trigger that keeps mirrored Personal Wallet transfers synchronized
--              when the source Organization transaction's amount, date, or description changes.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS mirrored_from_tx_id UUID
  REFERENCES public.transactions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_transactions_mirrored_from_tx_id
  ON public.transactions(mirrored_from_tx_id)
  WHERE mirrored_from_tx_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_mirrored_wallet_transfer_on_org_tx_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_name TEXT;
  v_prefix TEXT;
  v_fallback_label TEXT;
  v_next_desc TEXT;
  v_flip_direction BOOLEAN := FALSE;
BEGIN
  IF NEW.mirrored_from_tx_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_org_name
  FROM public.organizations
  WHERE id = NEW.organization_id;

  v_prefix := '[' || COALESCE(NULLIF(BTRIM(v_org_name), ''), 'Org') || ']';
  v_fallback_label := CASE
    WHEN NEW.type = 'income' THEN 'Income'
    WHEN NEW.type = 'held_return' THEN 'Refund'
    ELSE 'Business expense'
  END;

  IF NEW.description IS NOT NULL AND BTRIM(NEW.description) <> '' THEN
    v_next_desc := v_prefix || ' ' || BTRIM(NEW.description);
  ELSE
    v_next_desc := v_prefix || ' ' || v_fallback_label;
  END IF;

  IF (OLD.type = 'income' AND NEW.type IN ('expense_business', 'held_return'))
     OR (OLD.type IN ('expense_business', 'held_return') AND NEW.type = 'income') THEN
    v_flip_direction := TRUE;
  END IF;

  UPDATE public.transactions
  SET amount = NEW.amount,
      occurred_at = NEW.occurred_at,
      description = v_next_desc,
      account_id = CASE WHEN v_flip_direction THEN transfer_to_account_id ELSE account_id END,
      transfer_to_account_id = CASE WHEN v_flip_direction THEN account_id ELSE transfer_to_account_id END,
      updated_by_user_id = COALESCE(NEW.updated_by_user_id, updated_by_user_id),
      updated_at = NOW()
  WHERE mirrored_from_tx_id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_mirrored_wallet_transfer_on_org_tx_update
  AFTER UPDATE OF amount, occurred_at, description, type
  ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_mirrored_wallet_transfer_on_org_tx_update();
