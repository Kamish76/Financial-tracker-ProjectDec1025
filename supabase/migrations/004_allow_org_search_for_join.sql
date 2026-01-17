-- Allow searching organizations for users not yet members
-- Authenticated users should be able to search organizations for joining
-- This is needed because the join page needs to list organizations

drop policy if exists orgs_select_member on public.organizations;
drop policy if exists orgs_select_searchable on public.organizations;

-- Users who are members can view organizations
create policy orgs_select_member on public.organizations
  for select using (public.fn_has_org_role(id, array['owner','admin','member']));

-- Authenticated users can search all organizations (for joining)
create policy orgs_select_all_authenticated on public.organizations
  for select using (auth.role() = 'authenticated');
