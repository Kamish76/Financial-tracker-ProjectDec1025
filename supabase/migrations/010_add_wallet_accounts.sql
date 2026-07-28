-- Migration 010: Add Personal Wallet Sub Accounts
-- Description: Create wallet_accounts table for single-tenant multi-account tracking and link transactions to accounts
-- Purpose: Enable users in personal wallet mode to create custom sub accounts (Cash, Bank, Savings, etc.) with starting values

-- Create wallet_accounts table
CREATE TABLE IF NOT EXISTS public.wallet_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    starting_value NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- Add account_id column to transactions (nullable for backward compatibility and non-wallet orgs)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.wallet_accounts (id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_org ON public.wallet_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_active ON public.wallet_accounts(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);

-- Enable RLS on wallet_accounts
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view wallet accounts for their organizations
CREATE POLICY "Users can view wallet accounts for their organizations" 
    ON public.wallet_accounts 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_id
            AND om.user_id = auth.uid()
        )
    );

-- RLS Policy: Only admins/owners can insert/update/delete wallet accounts
CREATE POLICY "Admins and owners can insert wallet accounts"
    ON public.wallet_accounts
    FOR INSERT
    WITH CHECK (
        public.fn_has_org_role(organization_id, ARRAY['owner', 'admin']::text[])
    );

CREATE POLICY "Admins and owners can update wallet accounts"
    ON public.wallet_accounts
    FOR UPDATE
    USING (
        public.fn_has_org_role(organization_id, ARRAY['owner', 'admin']::text[])
    );

CREATE POLICY "Admins and owners can delete wallet accounts"
    ON public.wallet_accounts
    FOR DELETE
    USING (
        public.fn_has_org_role(organization_id, ARRAY['owner', 'admin']::text[])
    );
