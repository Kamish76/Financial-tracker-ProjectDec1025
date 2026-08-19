-- Create a secure function to fetch emails for members of a specific organization
-- This bypasses the need to fetch the entire auth.users list in the application layer

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

-- Grant access to authenticated users and service role
grant execute on function public.get_org_member_emails(uuid) to authenticated, service_role;
