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

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete set null,
  type text not null check (type in ('income','expense_business','expense_out_of_pocket')),
  amount numeric(12,2) not null check (amount > 0),
  description text,
  category text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_org_members_org on public.organization_members(organization_id);
create index if not exists idx_transactions_org on public.transactions(organization_id);
create index if not exists idx_invite_codes_org on public.invite_codes(organization_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.invite_codes enable row level security;
alter table public.transactions enable row level security;

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
  for select using (public.fn_has_org_role(organization_id, array['owner','admin','member']));

drop policy if exists org_members_insert_admin on public.organization_members;
create policy org_members_insert_admin on public.organization_members
  for insert with check (public.fn_has_org_role(organization_id, array['owner','admin']));

drop policy if exists org_members_update_admin on public.organization_members;
create policy org_members_update_admin on public.organization_members
  for update using (public.fn_has_org_role(organization_id, array['owner','admin']))
  with check (public.fn_has_org_role(organization_id, array['owner','admin']));

drop policy if exists org_members_delete_admin on public.organization_members;
create policy org_members_delete_admin on public.organization_members
  for delete using (public.fn_has_org_role(organization_id, array['owner','admin']));

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
  for select using (public.fn_has_org_role(organization_id, array['owner','admin','member']));

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

-- Default grants (Supabase typically handles). Ensure authenticated role can interact through policies.
grant execute on function public.fn_has_org_role(uuid, text[]) to authenticated, anon;
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.invite_codes to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
