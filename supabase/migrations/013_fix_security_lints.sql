-- Migration 013: Fix Security Linter Warnings
-- Description: Resolves various Supabase security lint warnings regarding search_path, RLS, and security definer functions.

-- ============================================================================
-- 1. Fix function_search_path_mutable
-- ============================================================================
ALTER FUNCTION public.levenshtein_distance(text, text) SET search_path = '';

-- ============================================================================
-- 2. Fix rls_policy_always_true
-- ============================================================================
DROP POLICY IF EXISTS "Allow service role to insert keep-alive logs" ON public.keep_alive_logs;
CREATE POLICY "Allow service role to insert keep-alive logs"
    ON public.keep_alive_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 3. Fix anon_security_definer_function_executable
-- ============================================================================
-- Revoke execute from public (which includes anon) for all flagged functions
REVOKE EXECUTE ON FUNCTION public.deactivate_member(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_has_org_role(uuid, text[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_or_create_category(uuid, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_org_member_emails(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reactivate_member(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.use_invite_code(text, uuid) FROM PUBLIC;

-- Explicitly grant execute back to authenticated for functions that need to be called by clients
GRANT EXECUTE ON FUNCTION public.deactivate_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_has_org_role(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_category(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_member_emails(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_invite_code(text, uuid) TO authenticated;

-- ============================================================================
-- 4. Fix authenticated_security_definer_function_executable
-- ============================================================================
-- Change functions to SECURITY INVOKER where they do not explicitly need to bypass RLS
ALTER FUNCTION public.deactivate_member(uuid, uuid) SECURITY INVOKER;
ALTER FUNCTION public.reactivate_member(uuid, uuid) SECURITY INVOKER;
ALTER FUNCTION public.get_or_create_category(uuid, text, integer) SECURITY INVOKER;

-- Revoke from authenticated for internal trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Note: fn_has_org_role, use_invite_code, and get_org_member_emails must remain 
-- SECURITY DEFINER because they are intentionally designed to bypass RLS for 
-- specific internal logic (e.g. reading an invite code before joining).
