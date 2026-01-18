-- Migration: Add soft delete to organization_members and enhance invite_codes
-- Date: 2026-01-18
-- Purpose: Enable soft deletion of members (preserves financial history) and improve invite code system

-- ============================================================================
-- 1. ADD SOFT DELETE COLUMNS TO organization_members
-- ============================================================================

-- Add is_active column (default true for existing members)
alter table public.organization_members
add column if not exists is_active boolean not null default true;

-- Add deactivated_at timestamp
alter table public.organization_members
add column if not exists deactivated_at timestamptz;

-- Add comment explaining the soft delete behavior
comment on column public.organization_members.is_active is 
  'Soft delete flag. When false, member is inactive but all historical data remains intact.';

comment on column public.organization_members.deactivated_at is 
  'Timestamp when member was deactivated. NULL if currently active.';

-- ============================================================================
-- 2. ENHANCE invite_codes TABLE
-- ============================================================================

-- Remove expires_at (we're using never-expiring codes)
alter table public.invite_codes
drop column if exists expires_at;

-- Add max_uses (nullable = unlimited uses)
alter table public.invite_codes
add column if not exists max_uses integer check (max_uses is null or max_uses > 0);

-- Add current_uses counter
alter table public.invite_codes
add column if not exists current_uses integer not null default 0 check (current_uses >= 0);

-- Add is_active flag
alter table public.invite_codes
add column if not exists is_active boolean not null default true;

-- Add comments
comment on column public.invite_codes.max_uses is 
  'Maximum number of times this code can be used. NULL means unlimited.';

comment on column public.invite_codes.current_uses is 
  'Number of times this code has been used.';

comment on column public.invite_codes.is_active is 
  'Whether this invite code is active. Revoked codes have is_active = false.';

-- ============================================================================
-- 3. ADD NEW INDEXES
-- ============================================================================

-- Index for filtering active/inactive members
create index if not exists idx_org_members_active 
  on public.organization_members(organization_id, is_active);

-- Index for member lookups with active status
create index if not exists idx_org_members_user_active 
  on public.organization_members(user_id, is_active);

-- Index for deactivated_at ordering
create index if not exists idx_org_members_deactivated_at 
  on public.organization_members(deactivated_at desc) 
  where deactivated_at is not null;

-- Index for active invite codes
create index if not exists idx_invite_codes_code_active 
  on public.invite_codes(code, is_active) 
  where is_active = true;

-- Index for organization's active invite codes
create index if not exists idx_invite_codes_org_active 
  on public.invite_codes(organization_id, is_active);

-- ============================================================================
-- 4. UPDATE RLS POLICIES TO RESPECT is_active
-- ============================================================================

-- Update organization_members SELECT policy to allow admins to see inactive members
-- Regular members only see active members
drop policy if exists org_members_select_member on public.organization_members;
create policy org_members_select_member on public.organization_members
  for select using (
    exists (
      select 1 from public.organization_members om2
      where om2.organization_id = organization_members.organization_id
        and om2.user_id = auth.uid()
        and om2.is_active = true
    )
  );

-- Update invite_codes SELECT policy to only show active codes
drop policy if exists invite_codes_select_member on public.invite_codes;
create policy invite_codes_select_member on public.invite_codes
  for select using (
    is_active = true 
    and public.fn_has_org_role(organization_id, array['owner','admin','member'])
  );

-- ============================================================================
-- 5. CREATE HELPER FUNCTIONS
-- ============================================================================

    -- Function to deactivate a member (soft delete)
    create or replace function public.deactivate_member(
    p_organization_id uuid,
    p_user_id uuid
    )
    returns boolean
    language plpgsql
    security definer
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

    comment on function public.deactivate_member is 
    'Soft delete a member from an organization. Preserves all historical data.';

    -- Function to reactivate a member
    create or replace function public.reactivate_member(
    p_organization_id uuid,
    p_user_id uuid
    )
    returns boolean
    language plpgsql
    security definer
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

    comment on function public.reactivate_member is 
    'Reactivate a previously deactivated member. Restores access and visibility.';

    -- Function to validate and use an invite code
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
    -- Find the invite code
    select * into v_invite_code
    from public.invite_codes
    where code = p_code
        and is_active = true
    for update; -- Lock the row to prevent race conditions
    
    if not found then
        return query select null::uuid, null::text, false, 'Invalid or inactive invite code';
        return;
    end if;
    
    -- Check if max uses exceeded
    if v_invite_code.max_uses is not null and v_invite_code.current_uses >= v_invite_code.max_uses then
        return query select null::uuid, null::text, false, 'This invite code has reached its maximum uses';
        return;
    end if;
    
    -- Get organization name
    select name into v_org_name
    from public.organizations
    where id = v_invite_code.organization_id;
    
    -- Check if user already exists in organization (active or inactive)
    select * into v_existing_member
    from public.organization_members
    where organization_id = v_invite_code.organization_id
        and user_id = p_user_id;
    
    if found then
        if v_existing_member.is_active then
        return query select v_invite_code.organization_id, v_org_name, false, 'You are already a member of this organization';
        return;
        else
        -- Reactivate the member
        perform public.reactivate_member(v_invite_code.organization_id, p_user_id);
        
        -- Increment the invite code usage
        update public.invite_codes
        set current_uses = current_uses + 1
        where id = v_invite_code.id;
        
        return query select v_invite_code.organization_id, v_org_name, true, null::text;
        return;
        end if;
    end if;
    
    -- Create new membership
    insert into public.organization_members (organization_id, user_id, role, invited_by)
    values (v_invite_code.organization_id, p_user_id, 'member', v_invite_code.created_by);
    
    -- Increment the invite code usage
    update public.invite_codes
    set current_uses = current_uses + 1
    where id = v_invite_code.id;
    
    return query select v_invite_code.organization_id, v_org_name, true, null::text;
    end;
    $$;

    comment on function public.use_invite_code is 
    'Validate and use an invite code to join an organization. Handles reactivation of previously deactivated members.';

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

grant execute on function public.deactivate_member(uuid, uuid) to authenticated;
grant execute on function public.reactivate_member(uuid, uuid) to authenticated;
grant execute on function public.use_invite_code(text, uuid) to authenticated;

-- ============================================================================
-- 7. UPDATE EXISTING DATA
-- ============================================================================

-- Set all existing members to active (if not already set by default)
update public.organization_members
set is_active = true
where is_active is null;

-- Set all existing invite codes to active (if not already set by default)
update public.invite_codes
set 
  is_active = true,
  current_uses = 0
where is_active is null or current_uses is null;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
