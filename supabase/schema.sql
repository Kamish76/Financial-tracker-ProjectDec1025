-- Supabase schema for OrgFinance
-- Run in Supabase SQL editor. Auth providers: email + Google.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Helper: check role membership
create or replace function public.fn_has_org_role(p_org_id uuid, p_roles text[])
returns boolean
language sql
security definer
set search_path = public
stable as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_org_id
      and om.user_id = auth.uid()
      and om.role = any(p_roles)
  );
$$;

-- Profiles (one-to-one with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Trigger: auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

-- Organization members (owner/admin/member)
create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- Invite codes (one active code per org ideally)
create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code text not null unique,
  expires_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Transactions (Enhanced with accountability fields)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete set null, -- who recorded it
  type text not null check (type in ('income','expense_business','expense_personal')),
  amount numeric(12,2) not null check (amount > 0),
  description text,
  category text,
  -- Accountability fields
  funded_by_type text not null default 'business' check (funded_by_type in ('business','personal')),
  funded_by_user_id uuid references public.profiles (id) on delete set null, -- who actually paid (null = business account)
  updated_by_user_id uuid references public.profiles (id) on delete set null, -- who last edited
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User contributions (calculated on-demand, cached here)
create table if not exists public.user_contributions (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  total_contributed numeric(12,2) not null default 0, -- sum of personal funds added
  total_received numeric(12,2) not null default 0, -- sum of reimbursements received
  net_balance numeric(12,2) generated always as (total_contributed - total_received) stored,
  last_calculated_at timestamptz,
  unique (organization_id, user_id)
);

-- Reimbursement requests
create table if not exists public.reimbursement_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  transaction_id uuid references public.transactions (id) on delete set null,
  from_user_id uuid not null references public.profiles (id) on delete cascade, -- who paid out-of-pocket
  to_user_id uuid references public.profiles (id) on delete set null, -- who will reimburse (null = organization)
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','approved','paid','rejected')),
  approval_required boolean not null default false, -- per-org setting
  notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null
);

-- Transaction allocations (optional: for split/shared costs)
create table if not exists public.transaction_allocations (
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  allocated_amount numeric(12,2) not null check (allocated_amount > 0),
  allocation_reason text,
  created_at timestamptz not null default now(),
  unique (transaction_id, user_id)
);

-- Indexes
create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_org_members_org on public.organization_members(organization_id);
create index if not exists idx_transactions_org on public.transactions(organization_id);
create index if not exists idx_transactions_funded_by on public.transactions(funded_by_user_id);
create index if not exists idx_transactions_updated_by on public.transactions(updated_by_user_id);
create index if not exists idx_invite_codes_org on public.invite_codes(organization_id);
create index if not exists idx_user_contributions_org on public.user_contributions(organization_id);
create index if not exists idx_user_contributions_user on public.user_contributions(user_id);
create index if not exists idx_reimbursement_requests_org on public.reimbursement_requests(organization_id);
create index if not exists idx_reimbursement_requests_from on public.reimbursement_requests(from_user_id);
create index if not exists idx_transaction_allocations_tx on public.transaction_allocations(transaction_id);
create index if not exists idx_transaction_allocations_user on public.transaction_allocations(user_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.invite_codes enable row level security;
alter table public.transactions enable row level security;
alter table public.user_contributions enable row level security;
alter table public.reimbursement_requests enable row level security;
alter table public.transaction_allocations enable row level security;

-- RLS policies
-- Profiles: users can read/write their own profile.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

-- Organizations: visible to members; updates/deletes restricted.
drop policy if exists orgs_select_member on public.organizations;
create policy orgs_select_member on public.organizations
  for select using (public.fn_has_org_role(id, array['owner','admin','member']));

drop policy if exists orgs_insert_owner on public.organizations;
create policy orgs_insert_owner on public.organizations
  for insert with check (auth.uid() = owner_id);

drop policy if exists orgs_update_owner on public.organizations;
create policy orgs_update_owner on public.organizations
  for update using (public.fn_has_org_role(id, array['owner']));

drop policy if exists orgs_delete_owner on public.organizations;
create policy orgs_delete_owner on public.organizations
  for delete using (public.fn_has_org_role(id, array['owner']));

-- Organization members: visible to members; edits by admin/owner; ownership transfer only owner.
drop policy if exists org_members_select_member on public.organization_members;
create policy org_members_select_member on public.organization_members
  for select using (
    exists (
      select 1 from public.organization_members om2
      where om2.organization_id = organization_members.organization_id
        and om2.user_id = auth.uid()
    )
  );

-- Allow org owners to insert themselves when creating a new organization
drop policy if exists org_members_insert_self_owner on public.organization_members;
create policy org_members_insert_self_owner on public.organization_members
  for insert with check (
    user_id = auth.uid() 
    and role = 'owner'
    and exists (
      select 1 from public.organizations 
      where id = organization_id 
      and owner_id = auth.uid()
    )
  );

-- Allow admins/owners to add other members
drop policy if exists org_members_insert_admin on public.organization_members;
create policy org_members_insert_admin on public.organization_members
  for insert with check (
    exists (
      select 1 from public.organization_members om2
      where om2.organization_id = organization_members.organization_id
        and om2.user_id = auth.uid()
        and om2.role in ('owner','admin')
    )
  );

drop policy if exists org_members_update_admin on public.organization_members;
create policy org_members_update_admin on public.organization_members
  for update using (
    exists (
      select 1 from public.organization_members om2
      where om2.organization_id = organization_members.organization_id
        and om2.user_id = auth.uid()
        and om2.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1 from public.organization_members om2
      where om2.organization_id = organization_members.organization_id
        and om2.user_id = auth.uid()
        and om2.role in ('owner','admin')
    )
  );

drop policy if exists org_members_delete_admin on public.organization_members;
create policy org_members_delete_admin on public.organization_members
  for delete using (
    exists (
      select 1 from public.organization_members om2
      where om2.organization_id = organization_members.organization_id
        and om2.user_id = auth.uid()
        and om2.role in ('owner','admin')
    )
  );

-- Invite codes: manage by admin/owner; readable by members.
drop policy if exists invite_codes_select_member on public.invite_codes;
create policy invite_codes_select_member on public.invite_codes
  for select using (public.fn_has_org_role(organization_id, array['owner','admin','member']));

drop policy if exists invite_codes_insert_admin on public.invite_codes;
create policy invite_codes_insert_admin on public.invite_codes
  for insert with check (public.fn_has_org_role(organization_id, array['owner','admin']));

drop policy if exists invite_codes_update_admin on public.invite_codes;
create policy invite_codes_update_admin on public.invite_codes
  for update using (public.fn_has_org_role(organization_id, array['owner','admin']))
  with check (public.fn_has_org_role(organization_id, array['owner','admin']));

drop policy if exists invite_codes_delete_admin on public.invite_codes;
create policy invite_codes_delete_admin on public.invite_codes
  for delete using (public.fn_has_org_role(organization_id, array['owner','admin']));

-- Transactions: members can read; admins/owners can write.
drop policy if exists tx_select_member on public.transactions;
create policy tx_select_member on public.transactions
  for select using (true);

drop policy if exists tx_insert_admin on public.transactions;
create policy tx_insert_admin on public.transactions
  for insert with check (public.fn_has_org_role(organization_id, array['owner','admin']));

drop policy if exists tx_update_admin on public.transactions;
create policy tx_update_admin on public.transactions
  for update using (public.fn_has_org_role(organization_id, array['owner','admin']))
  with check (public.fn_has_org_role(organization_id, array['owner','admin']));

drop policy if exists tx_delete_admin on public.transactions;
create policy tx_delete_admin on public.transactions
  for delete using (public.fn_has_org_role(organization_id, array['owner','admin']));

-- User contributions: members can read their own and org totals; system updates.
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

-- Reimbursement requests: members can read; admins/owners can manage.
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

-- Transaction allocations: members can read; admins/owners can manage.
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

-- Default grants (Supabase typically handles). Ensure authenticated role can interact through policies.
grant execute on function public.fn_has_org_role(uuid, text[]) to authenticated, anon;
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.invite_codes to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.user_contributions to authenticated;
grant select, insert, update, delete on public.reimbursement_requests to authenticated;
grant select, insert, update, delete on public.transaction_allocations to authenticated;
