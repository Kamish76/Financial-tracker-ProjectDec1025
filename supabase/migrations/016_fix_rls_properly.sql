-- Migration 016: Fix RLS Recursion and Ambiguous Columns
-- Description: Resolve infinite recursion in organization_members and ambiguous column references in SELECT policies
-- Purpose: Ensure transaction_categories and wallet_accounts sync properly without throwing 500 errors

-- 1. Create a secure, non-inlinable function to check basic membership (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.fn_is_org_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id
    AND user_id = auth.uid()
    AND is_active = true
  );
END;
$$;

-- Ensure fn_has_org_role is also plpgsql so it cannot be inlined (which causes recursion)
CREATE OR REPLACE FUNCTION public.fn_has_org_role(p_org_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id
    AND user_id = auth.uid()
    AND role = ANY(p_roles)
    AND is_active = true
  );
END;
$$;

-- 2. Fix organization_members SELECT policy to use the secure helper function
DROP POLICY IF EXISTS org_members_select_member ON public.organization_members;
CREATE POLICY org_members_select_member ON public.organization_members
  FOR SELECT USING (
    -- User can see their own membership record OR any record in an organization they are a member of
    user_id = auth.uid() OR public.fn_is_org_member(organization_id)
  );

-- 3. Fix transaction_categories SELECT policy to use secure helper and avoid ambiguous columns
DROP POLICY IF EXISTS "Users can view categories for their organizations" ON public.transaction_categories;
CREATE POLICY "Users can view categories for their organizations" 
    ON public.transaction_categories 
    FOR SELECT 
    USING (
        public.fn_is_org_member(organization_id)
    );

-- 4. Fix wallet_accounts SELECT policy to use secure helper
DROP POLICY IF EXISTS "Users can view wallet accounts for their organizations" ON public.wallet_accounts;
CREATE POLICY "Users can view wallet accounts for their organizations" 
    ON public.wallet_accounts 
    FOR SELECT 
    USING (
        public.fn_is_org_member(organization_id)
    );

-- 5. Restore secure SELECT policy for transactions (was using 'true' as a temporary hack in migration 003)
DROP POLICY IF EXISTS tx_select_member ON public.transactions;
CREATE POLICY tx_select_member ON public.transactions
  FOR SELECT USING (
      public.fn_is_org_member(organization_id)
  );
