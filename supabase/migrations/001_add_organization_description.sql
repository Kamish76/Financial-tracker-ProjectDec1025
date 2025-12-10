-- Migration: Add description column to organizations table
-- Run this in Supabase SQL Editor or via Supabase CLI

-- Add description column (nullable text field)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS description text;

-- Add a comment for documentation
COMMENT ON COLUMN public.organizations.description IS 'Optional description of the organization';

-- Fix RLS policy for organization_members to allow org creators to add themselves
-- The existing policy only allows admin/owner to insert, but when creating a new org,
-- the creator isn't a member yet. This policy allows users to insert themselves as owner
-- of an organization they own.

DROP POLICY IF EXISTS org_members_insert_self_owner ON public.organization_members;
CREATE POLICY org_members_insert_self_owner ON public.organization_members
  FOR INSERT WITH CHECK (
    -- User can insert themselves as owner if they own the organization
    user_id = auth.uid() 
    AND role = 'owner'
    AND EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = organization_id 
      AND owner_id = auth.uid()
    )
  );

-- Ensure profiles RLS allows users to insert their own profile if missing
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
