-- Supabase cumulative schema for OrgFinance
-- Incorporates all migrations 000 through 017.
-- Auth providers: email + Google.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- Profiles (one-to-one with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

-- Organization members (owner/admin/member)
create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  is_active boolean not null default true,
  deactivated_at timestamptz,
  unique (organization_id, user_id)
);

-- Invite codes (one active code per org ideally)
create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code text not null unique,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  max_uses integer check (max_uses is null or max_uses > 0),
  current_uses integer not null default 0 check (current_uses >= 0),
  is_active boolean not null default true
);

-- Transaction categories (normalized categories per org with alias & fuzzy matching support)
create table if not exists public.transaction_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  normalized_name text not null,
  aliases text[] default '{}',
  is_custom boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, normalized_name)
);

-- Wallet accounts (sub-accounts for personal wallet mode: Cash, Bank, etc.)
create table if not exists public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  starting_value numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

-- Transactions (Enhanced with accountability fields, categories, wallet accounts, and initial balance markers)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete set null, -- who recorded it
  type text not null check (type in ('income','expense_business','expense_personal','held_allocate','held_return','transfer')),
  amount numeric(12,2) not null check (amount > 0),
  description text,
  category text,
  funded_by_type text not null default 'business' check (funded_by_type in ('business','personal')),
  funded_by_user_id uuid references public.profiles (id) on delete set null, -- who actually paid (null = business account)
  updated_by_user_id uuid references public.profiles (id) on delete set null, -- who last edited
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_initial boolean not null default false,
  category_id uuid references public.transaction_categories (id) on delete set null,
  account_id uuid references public.wallet_accounts (id) on delete set null,
  transfer_to_account_id uuid references public.wallet_accounts (id) on delete set null
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

-- Transaction allocations (split/shared costs)
create table if not exists public.transaction_allocations (
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  allocated_amount numeric(12,2) not null check (allocated_amount > 0),
  allocation_reason text,
  created_at timestamptz not null default now(),
  unique (transaction_id, user_id)
);

-- Keep-alive logs (audit trail for Vercel Cron keep-alive pings)
create table if not exists public.keep_alive_logs (
  id uuid primary key default gen_random_uuid(),
  executed_at timestamptz not null default now(),
  database_active boolean not null default true,
  organization_count integer not null,
  transaction_count integer not null,
  response_time_ms integer not null,
  status text not null check (status in ('success', 'error', 'warning')),
  error_message text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 2. HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- Trigger function: auto-create profile when user signs up
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

-- Helper: check if caller is an active org member (prevents RLS recursion)
create or replace function public.fn_is_org_member(p_org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.organization_members
    where organization_id = p_org_id
      and user_id = auth.uid()
      and is_active = true
  );
end;
$$;

-- Helper: check role membership with active status check
create or replace function public.fn_has_org_role(p_org_id uuid, p_roles text[])
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_org_id
      and om.user_id = auth.uid()
      and om.role = any(p_roles)
      and om.is_active = true
  );
end;
$$;

-- Helper: soft-delete an organization member
create or replace function public.deactivate_member(
  p_organization_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.organization_members
  set 
    is_active = false,
    deactivated_at = now()
  where organization_id = p_organization_id
    and user_id = p_user_id
    and is_active = true;
  
  return found;
end;
$$;

-- Helper: reactivate a previously deactivated member
create or replace function public.reactivate_member(
  p_organization_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.organization_members
  set 
    is_active = true,
    deactivated_at = null
  where organization_id = p_organization_id
    and user_id = p_user_id
    and is_active = false;
  
  return found;
end;
$$;

-- Helper: validate and use an invite code
create or replace function public.use_invite_code(
  p_code text,
  p_user_id uuid
)
returns table(
  organization_id uuid,
  organization_name text,
  success boolean,
  error_message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite_code record;
  v_org_name text;
  v_existing_member record;
begin
  select * into v_invite_code
  from public.invite_codes
  where code = p_code
    and is_active = true
  for update;

  if not found then
    return query select null::uuid, null::text, false, 'Invalid or inactive invite code';
    return;
  end if;

  if v_invite_code.max_uses is not null and v_invite_code.current_uses >= v_invite_code.max_uses then
    return query select null::uuid, null::text, false, 'This invite code has reached its maximum uses';
    return;
  end if;

  select name into v_org_name
  from public.organizations
  where id = v_invite_code.organization_id;

  select * into v_existing_member
  from public.organization_members
  where organization_id = v_invite_code.organization_id
    and user_id = p_user_id;

  if found then
    if v_existing_member.is_active then
      return query select v_invite_code.organization_id, v_org_name, false, 'You are already a member of this organization';
      return;
    else
      perform public.reactivate_member(v_invite_code.organization_id, p_user_id);
      
      update public.invite_codes
      set current_uses = current_uses + 1
      where id = v_invite_code.id;
      
      return query select v_invite_code.organization_id, v_org_name, true, null::text;
      return;
    end if;
  end if;

  insert into public.organization_members (organization_id, user_id, role, invited_by)
  values (v_invite_code.organization_id, p_user_id, 'member', v_invite_code.created_by);

  update public.invite_codes
  set current_uses = current_uses + 1
  where id = v_invite_code.id;

  return query select v_invite_code.organization_id, v_org_name, true, null::text;
end;
$$;

-- Helper: calculate Levenshtein distance between two strings
create or replace function public.levenshtein_distance(s1 text, s2 text)
returns integer
language plpgsql
immutable
set search_path = ''
as $$
declare
  len1 integer := length(s1);
  len2 integer := length(s2);
  d integer[][];
  i integer;
  j integer;
  cost integer;
begin
  if len1 = 0 then
    return len2;
  end if;
  if len2 = 0 then
    return len1;
  end if;

  d := array_fill(0, ARRAY[len1 + 1, len2 + 1]);

  for i in 0..len1 loop
    d[i+1][1] := i;
  end loop;

  for j in 0..len2 loop
    d[1][j+1] := j;
  end loop;

  for i in 1..len1 loop
    for j in 1..len2 loop
      if substr(s1, i, 1) = substr(s2, j, 1) then
        cost := 0;
      else
        cost := 1;
      end if;
      
      d[i+1][j+1] := least(
        d[i][j+1] + 1,       -- deletion
        d[i+1][j] + 1,       -- insertion
        d[i][j] + cost       -- substitution
      );
    end loop;
  end loop;

  return d[len1+1][len2+1];
end;
$$;

-- Helper: get or create category with fuzzy matching support
create or replace function public.get_or_create_category(
  p_org_id uuid,
  p_input_name text,
  p_max_distance integer default 2
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_category_id uuid;
  v_normalized_input text;
  v_match_id uuid;
  v_min_distance int;
begin
  v_normalized_input := lower(trim(regexp_replace(p_input_name, '\s+', ' ', 'g')));
  
  if v_normalized_input = '' then
    return null;
  end if;
  
  select id into v_category_id
  from public.transaction_categories
  where organization_id = p_org_id
    and normalized_name = v_normalized_input
  limit 1;
  
  if v_category_id is not null then
    return v_category_id;
  end if;
  
  select id, min(public.levenshtein_distance(normalized_name, v_normalized_input)) as min_dist
  into v_match_id, v_min_distance
  from public.transaction_categories
  where organization_id = p_org_id
    and public.levenshtein_distance(normalized_name, v_normalized_input) <= p_max_distance
  group by id
  order by min_dist asc
  limit 1;
  
  if v_match_id is not null then
    update public.transaction_categories
    set aliases = case
      when not (aliases @> array[v_normalized_input]) then array_append(aliases, v_normalized_input)
      else aliases
    end
    where id = v_match_id;
    
    return v_match_id;
  end if;
  
  insert into public.transaction_categories (organization_id, normalized_name, aliases, is_custom)
  values (p_org_id, v_normalized_input, array[]::text[], true)
  returning id into v_category_id;
  
  return v_category_id;
end;
$$;

-- Helper: get organization member emails
create or replace function public.get_org_member_emails(p_org_id uuid)
returns table(user_id uuid, email text)
language sql
security definer
set search_path = public
as $$
  select u.id, u.email
  from auth.users u
  join public.organization_members om on om.user_id = u.id
  where om.organization_id = p_org_id;
$$;

-- ============================================================================
-- 3. INDEXES (Cumulative 000-017)
-- ============================================================================

-- Profiles & Organization Members
create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_org_members_org on public.organization_members(organization_id);
create index if not exists idx_org_members_active on public.organization_members(organization_id, is_active);
create index if not exists idx_org_members_user_active on public.organization_members(user_id, is_active);
create index if not exists idx_org_members_deactivated_at on public.organization_members(deactivated_at desc) where deactivated_at is not null;

-- Transactions
create index if not exists idx_transactions_org on public.transactions(organization_id);
create index if not exists idx_transactions_funded_by on public.transactions(funded_by_user_id);
create index if not exists idx_transactions_updated_by on public.transactions(updated_by_user_id);
create index if not exists idx_transactions_org_initial on public.transactions(organization_id, is_initial);
create index if not exists idx_transactions_category_id on public.transactions(category_id);
create index if not exists idx_transactions_account_id on public.transactions(account_id);
create index if not exists idx_transactions_transfer_to_account on public.transactions(transfer_to_account_id);

-- Invite Codes
create index if not exists idx_invite_codes_org on public.invite_codes(organization_id);
create index if not exists idx_invite_codes_code_active on public.invite_codes(code, is_active) where is_active = true;
create index if not exists idx_invite_codes_org_active on public.invite_codes(organization_id, is_active);

-- User Contributions
create index if not exists idx_user_contributions_org on public.user_contributions(organization_id);
create index if not exists idx_user_contributions_user on public.user_contributions(user_id);

-- Reimbursement Requests
create index if not exists idx_reimbursement_requests_org on public.reimbursement_requests(organization_id);
create index if not exists idx_reimbursement_requests_from on public.reimbursement_requests(from_user_id);

-- Transaction Allocations
create index if not exists idx_transaction_allocations_tx on public.transaction_allocations(transaction_id);
create index if not exists idx_transaction_allocations_user on public.transaction_allocations(user_id);

-- Keep-Alive Logs
create index if not exists idx_keep_alive_logs_executed_at on public.keep_alive_logs(executed_at desc);
create index if not exists idx_keep_alive_logs_status on public.keep_alive_logs(status);

-- Transaction Categories
create index if not exists idx_transaction_categories_org on public.transaction_categories(organization_id);
create index if not exists idx_transaction_categories_normalized_name on public.transaction_categories(organization_id, normalized_name);

-- Wallet Accounts
create index if not exists idx_wallet_accounts_org on public.wallet_accounts(organization_id);
create index if not exists idx_wallet_accounts_active on public.wallet_accounts(organization_id, is_active);

-- ============================================================================
-- 4. ROW-LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.invite_codes enable row level security;
alter table public.transactions enable row level security;
alter table public.user_contributions enable row level security;
alter table public.reimbursement_requests enable row level security;
alter table public.transaction_allocations enable row level security;
alter table public.transaction_categories enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.keep_alive_logs enable row level security;

-- Profiles: users can read/write their own profile.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

-- Organizations: visible to members; updates/deletes restricted.
drop policy if exists orgs_select_member on public.organizations;
create policy orgs_select_member on public.organizations
  for select using (public.fn_has_org_role(id, array['owner','admin','member']));

-- Allow authenticated users to search organizations for joining (dropped in migration 018)
drop policy if exists orgs_select_all_authenticated on public.organizations;
create policy orgs_select_all_authenticated on public.organizations
  for select using (auth.role() = 'authenticated');

drop policy if exists orgs_insert_owner on public.organizations;
create policy orgs_insert_owner on public.organizations
  for insert with check (auth.uid() = owner_id);

drop policy if exists orgs_update_owner on public.organizations;
create policy orgs_update_owner on public.organizations
  for update using (public.fn_has_org_role(id, array['owner']));

drop policy if exists orgs_delete_owner on public.organizations;
create policy orgs_delete_owner on public.organizations
  for delete using (public.fn_has_org_role(id, array['owner']));

-- Organization members: visible to self or fellow active members; edits by admin/owner
drop policy if exists org_members_select_member on public.organization_members;
create policy org_members_select_member on public.organization_members
  for select using (user_id = auth.uid() or public.fn_is_org_member(organization_id));

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

-- Invite codes: manage by admin/owner; readable by members
drop policy if exists invite_codes_select_member on public.invite_codes;
create policy invite_codes_select_member on public.invite_codes
  for select using (is_active = true and public.fn_has_org_role(organization_id, array['owner','admin','member']));

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

-- Transactions: members can read; admins/owners can write (initial transactions protected)
drop policy if exists tx_select_member on public.transactions;
create policy tx_select_member on public.transactions
  for select using (public.fn_is_org_member(organization_id));

drop policy if exists tx_insert_admin on public.transactions;
create policy tx_insert_admin on public.transactions
  for insert with check (public.fn_has_org_role(organization_id, array['owner','admin']));

drop policy if exists tx_update_admin on public.transactions;
create policy tx_update_admin on public.transactions
  for update using (
    case 
      when is_initial = true then public.fn_has_org_role(organization_id, array['owner'])
      else public.fn_has_org_role(organization_id, array['owner','admin'])
    end
  )
  with check (
    case 
      when is_initial = true then public.fn_has_org_role(organization_id, array['owner'])
      else public.fn_has_org_role(organization_id, array['owner','admin'])
    end
  );

drop policy if exists tx_delete_admin on public.transactions;
create policy tx_delete_admin on public.transactions
  for delete using (
    case 
      when is_initial = true then public.fn_has_org_role(organization_id, array['owner'])
      else public.fn_has_org_role(organization_id, array['owner','admin'])
    end
  );

-- User contributions: members can read; admins/owners manage
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

-- Reimbursement requests: members can read and create; admins/owners can manage
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

-- Transaction allocations: members can read; admins/owners can manage
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

-- Transaction categories: members can view; admins/owners can manage
drop policy if exists "Users can view categories for their organizations" on public.transaction_categories;
create policy "Users can view categories for their organizations" on public.transaction_categories
  for select using (public.fn_is_org_member(organization_id));

drop policy if exists "Admins and owners can manage categories" on public.transaction_categories;
create policy "Admins and owners can manage categories" on public.transaction_categories
  for insert with check (public.fn_has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Admins and owners can update categories" on public.transaction_categories;
create policy "Admins and owners can update categories" on public.transaction_categories
  for update using (public.fn_has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Admins and owners can delete categories" on public.transaction_categories;
create policy "Admins and owners can delete categories" on public.transaction_categories
  for delete using (public.fn_has_org_role(organization_id, array['owner', 'admin']));

-- Wallet accounts: members can view; admins/owners can manage
drop policy if exists "Users can view wallet accounts for their organizations" on public.wallet_accounts;
create policy "Users can view wallet accounts for their organizations" on public.wallet_accounts
  for select using (public.fn_is_org_member(organization_id));

drop policy if exists "Admins and owners can insert wallet accounts" on public.wallet_accounts;
create policy "Admins and owners can insert wallet accounts" on public.wallet_accounts
  for insert with check (public.fn_has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Admins and owners can update wallet accounts" on public.wallet_accounts;
create policy "Admins and owners can update wallet accounts" on public.wallet_accounts
  for update using (public.fn_has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Admins and owners can delete wallet accounts" on public.wallet_accounts;
create policy "Admins and owners can delete wallet accounts" on public.wallet_accounts
  for delete using (public.fn_has_org_role(organization_id, array['owner', 'admin']));

-- Keep-alive logs (Restricted further in migration 018)
drop policy if exists "Allow service role to insert keep-alive logs" on public.keep_alive_logs;
create policy "Allow service role to insert keep-alive logs" on public.keep_alive_logs
  for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Allow authenticated users to view keep-alive logs" on public.keep_alive_logs;
create policy "Allow authenticated users to view keep-alive logs" on public.keep_alive_logs
  for select to authenticated
  using (true);

-- ============================================================================
-- 5. PERMISSIONS & ROLE GRANTS
-- ============================================================================

grant usage on schema public to authenticated, anon;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.invite_codes to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.user_contributions to authenticated;
grant select, insert, update, delete on public.reimbursement_requests to authenticated;
grant select, insert, update, delete on public.transaction_allocations to authenticated;
grant select, insert, update, delete on public.transaction_categories to authenticated;
grant select, insert, update, delete on public.wallet_accounts to authenticated;
grant select, insert on public.keep_alive_logs to authenticated;

-- Function execute grants
grant execute on function public.fn_is_org_member(uuid) to authenticated;
grant execute on function public.fn_has_org_role(uuid, text[]) to authenticated;
grant execute on function public.deactivate_member(uuid, uuid) to authenticated;
grant execute on function public.reactivate_member(uuid, uuid) to authenticated;
grant execute on function public.use_invite_code(text, uuid) to authenticated;
grant execute on function public.levenshtein_distance(text, text) to authenticated;
grant execute on function public.get_or_create_category(uuid, text, integer) to authenticated;
grant execute on function public.get_org_member_emails(uuid) to authenticated, service_role;

-- Revocations from anon and public (Security Hardening 013, 015)
revoke execute on function public.handle_new_user() from authenticated, anon, public;
revoke execute on function public.fn_has_org_role(uuid, text[]) from anon, public;
revoke execute on function public.fn_is_org_member(uuid) from anon, public;
revoke execute on function public.deactivate_member(uuid, uuid) from anon, public;
revoke execute on function public.reactivate_member(uuid, uuid) from anon, public;
revoke execute on function public.use_invite_code(text, uuid) from anon, public;
revoke execute on function public.levenshtein_distance(text, text) from anon, public;
revoke execute on function public.get_or_create_category(uuid, text, integer) from anon, public;
revoke execute on function public.get_org_member_emails(uuid) from anon, public;
