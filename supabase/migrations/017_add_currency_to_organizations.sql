-- Add currency column to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
