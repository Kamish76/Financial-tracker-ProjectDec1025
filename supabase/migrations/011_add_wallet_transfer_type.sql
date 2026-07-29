-- Migration 011: Add Wallet Transfer Type & Transfer Destination Account
-- Description: Enable atomic transfer transactions between two wallet sub accounts
-- Purpose: Support 'transfer' transaction type and link destination account via transfer_to_account_id

-- Drop existing type check constraint on transactions table
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Recreate constraint including 'transfer'
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('income', 'expense_business', 'expense_personal', 'held_allocate', 'held_return', 'transfer'));

-- Add transfer_to_account_id column (nullable for non-transfer transactions)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transfer_to_account_id UUID REFERENCES public.wallet_accounts (id) ON DELETE SET NULL;

-- Create index for faster querying of incoming transfers
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_to_account ON public.transactions(transfer_to_account_id);

-- Update comment on transactions.type
COMMENT ON COLUMN public.transactions.type IS 
  'Transaction type: income (revenue), expense_business (paid from business funds), expense_personal (paid personally, reimbursable), held_allocate (baseline allocation from org pool to member), held_return (return baseline allocation from member to org pool), transfer (transfer between wallet sub accounts)';
