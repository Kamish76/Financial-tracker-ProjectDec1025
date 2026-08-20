-- Migration 015: Finalize Security Lints for Anon Role
-- Description: Explicitly revokes EXECUTE permissions from the 'anon' role for internal and authenticated-only functions.

-- 1. Explicitly revoke from 'anon' (since it was explicitly granted in 000)
REVOKE EXECUTE ON FUNCTION public.deactivate_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_has_org_role(uuid, text[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_or_create_category(uuid, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_org_member_emails(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.reactivate_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.use_invite_code(text, uuid) FROM anon;

-- 2. Explicitly revoke from 'authenticated' for internal triggers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
