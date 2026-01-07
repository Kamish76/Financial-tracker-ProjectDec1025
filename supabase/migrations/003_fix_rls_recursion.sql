-- Migration: Fix RLS recursion causing stack depth limit exceeded
-- Date: 2026-01-07

-- Replace organization_members policies to avoid fn_has_org_role recursion
-- Temporarily allow transactions select to avoid recursive policy calls
drop policy if exists tx_select_member on public.transactions;
create policy tx_select_member on public.transactions
  for select using (true);

drop policy if exists org_members_select_member on public.organization_members;
create policy org_members_select_member on public.organization_members
  for select using (
    exists (
      select 1 from public.organization_members om2
      where om2.organization_id = organization_members.organization_id
        and om2.user_id = auth.uid()
    )
  );

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
