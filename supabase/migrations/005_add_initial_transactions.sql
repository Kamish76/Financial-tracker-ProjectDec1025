-- Add is_initial column to transactions table
-- This allows owners to add setup/initial transactions that appear in the regular feed
-- but can only be deleted/edited by organization owners

-- Add the column
alter table public.transactions 
  add column if not exists is_initial boolean default false not null;

-- Create index for efficient querying of initial transactions
create index if not exists idx_transactions_org_initial 
  on public.transactions(organization_id, is_initial);

-- Drop existing delete policy if exists and recreate with initial transaction handling
drop policy if exists tx_delete_admin on public.transactions;

-- Regular transactions: owner/admin can delete
-- Initial transactions: only owner can delete
create policy tx_delete_admin on public.transactions
  for delete using (
    case 
      when is_initial = true then public.fn_has_org_role(organization_id, array['owner'])
      else public.fn_has_org_role(organization_id, array['owner','admin'])
    end
  );

-- Drop existing update policy if exists and recreate with initial transaction handling
drop policy if exists tx_update_admin on public.transactions;

-- Regular transactions: owner/admin can update
-- Initial transactions: only owner can update
create policy tx_update_admin on public.transactions
  for update using (
    case 
      when is_initial = true then public.fn_has_org_role(organization_id, array['owner'])
      else public.fn_has_org_role(organization_id, array['owner','admin'])
    end
  );
