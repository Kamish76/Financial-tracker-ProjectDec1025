-- Migration: Add User Accountability System
-- Date: 2026-01-07
-- Description: Adds enhanced accountability tracking for transactions, user contributions, 
--              reimbursement requests, and optional cost allocations

-- Step 1: Add new fields to transactions table
alter table public.transactions 
  alter column type type text, 
  drop constraint if exists transactions_type_check,
  add constraint transactions_type_check check (type in ('income','expense_business','expense_personal'));

alter table public.transactions 
  add column if not exists funded_by_type text not null default 'business' check (funded_by_type in ('business','personal')),
  add column if not exists funded_by_user_id uuid references public.profiles (id) on delete set null,
  add column if not exists updated_by_user_id uuid references public.profiles (id) on delete set null;

comment on column public.transactions.funded_by_type is 'Source of funds: business (org funds) or personal (out-of-pocket)';
comment on column public.transactions.funded_by_user_id is 'User who actually paid (null = business account)';
comment on column public.transactions.updated_by_user_id is 'User who last edited this transaction (audit trail)';

-- Step 2: Create user_contributions table
create table if not exists public.user_contributions (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  total_contributed numeric(12,2) not null default 0,
  total_received numeric(12,2) not null default 0,
  net_balance numeric(12,2) generated always as (total_contributed - total_received) stored,
  last_calculated_at timestamptz,
  unique (organization_id, user_id)
);

comment on table public.user_contributions is 'Cached user contribution balances per organization';
comment on column public.user_contributions.total_contributed is 'Sum of personal funds contributed to organization';
comment on column public.user_contributions.total_received is 'Sum of reimbursements received from organization';
comment on column public.user_contributions.net_balance is 'Calculated net balance (contributed - received)';

-- Step 3: Create reimbursement_requests table
create table if not exists public.reimbursement_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  transaction_id uuid references public.transactions (id) on delete set null,
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid references public.profiles (id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','approved','paid','rejected')),
  approval_required boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null
);

comment on table public.reimbursement_requests is 'Track out-of-pocket expenses requiring reimbursement';
comment on column public.reimbursement_requests.from_user_id is 'User who paid out-of-pocket';
comment on column public.reimbursement_requests.to_user_id is 'User who will reimburse (null = organization)';
comment on column public.reimbursement_requests.approval_required is 'Whether this request requires approval (per-org setting)';

-- Step 4: Create transaction_allocations table (optional)
create table if not exists public.transaction_allocations (
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  allocated_amount numeric(12,2) not null check (allocated_amount > 0),
  allocation_reason text,
  created_at timestamptz not null default now(),
  unique (transaction_id, user_id)
);

comment on table public.transaction_allocations is 'Support for split/shared costs across multiple users';

-- Step 5: Add indexes
create index if not exists idx_transactions_funded_by on public.transactions(funded_by_user_id);
create index if not exists idx_transactions_updated_by on public.transactions(updated_by_user_id);
create index if not exists idx_user_contributions_org on public.user_contributions(organization_id);
create index if not exists idx_user_contributions_user on public.user_contributions(user_id);
create index if not exists idx_reimbursement_requests_org on public.reimbursement_requests(organization_id);
create index if not exists idx_reimbursement_requests_from on public.reimbursement_requests(from_user_id);
create index if not exists idx_transaction_allocations_tx on public.transaction_allocations(transaction_id);
create index if not exists idx_transaction_allocations_user on public.transaction_allocations(user_id);

-- Step 6: Enable RLS
alter table public.user_contributions enable row level security;
alter table public.reimbursement_requests enable row level security;
alter table public.transaction_allocations enable row level security;

-- Step 7: Add RLS policies for user_contributions
drop policy if exists user_contrib_select_member on public.user_contributions;
create policy user_contrib_select_member on public.user_contributions
  for select using (public.fn_has_org_role(organization_id, array['owner','admin','member']));

drop policy if exists user_contrib_insert_system on public.user_contributions;
create policy user_contrib_insert_system on public.user_contributions
  for insert with check (public.fn_has_org_role(organization_id, array['owner','admin']));

drop policy if exists user_contrib_update_system on public.user_contributions;
create policy user_contrib_update_system on public.user_contributions
  for update using (public.fn_has_org_role(organization_id, array['owner','admin']))
  with check (public.fn_has_org_role(organization_id, array['owner','admin']));

-- Step 8: Add RLS policies for reimbursement_requests
drop policy if exists reimb_select_member on public.reimbursement_requests;
create policy reimb_select_member on public.reimbursement_requests
  for select using (public.fn_has_org_role(organization_id, array['owner','admin','member']));

drop policy if exists reimb_insert_member on public.reimbursement_requests;
create policy reimb_insert_member on public.reimbursement_requests
  for insert with check (public.fn_has_org_role(organization_id, array['owner','admin','member']));

drop policy if exists reimb_update_admin on public.reimbursement_requests;
create policy reimb_update_admin on public.reimbursement_requests
  for update using (public.fn_has_org_role(organization_id, array['owner','admin']))
  with check (public.fn_has_org_role(organization_id, array['owner','admin']));

drop policy if exists reimb_delete_admin on public.reimbursement_requests;
create policy reimb_delete_admin on public.reimbursement_requests
  for delete using (public.fn_has_org_role(organization_id, array['owner','admin']));

-- Step 9: Add RLS policies for transaction_allocations
drop policy if exists tx_alloc_select_member on public.transaction_allocations;
create policy tx_alloc_select_member on public.transaction_allocations
  for select using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
      and public.fn_has_org_role(t.organization_id, array['owner','admin','member'])
    )
  );

drop policy if exists tx_alloc_insert_admin on public.transaction_allocations;
create policy tx_alloc_insert_admin on public.transaction_allocations
  for insert with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
      and public.fn_has_org_role(t.organization_id, array['owner','admin'])
    )
  );

drop policy if exists tx_alloc_update_admin on public.transaction_allocations;
create policy tx_alloc_update_admin on public.transaction_allocations
  for update using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
      and public.fn_has_org_role(t.organization_id, array['owner','admin'])
    )
  )
  with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
      and public.fn_has_org_role(t.organization_id, array['owner','admin'])
    )
  );

drop policy if exists tx_alloc_delete_admin on public.transaction_allocations;
create policy tx_alloc_delete_admin on public.transaction_allocations
  for delete using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
      and public.fn_has_org_role(t.organization_id, array['owner','admin'])
    )
  );

-- Step 10: Grant permissions
grant select, insert, update, delete on public.user_contributions to authenticated;
grant select, insert, update, delete on public.reimbursement_requests to authenticated;
grant select, insert, update, delete on public.transaction_allocations to authenticated;
