-- Migration 014: Migrate legacy transaction types and expand type constraint
-- Description: Updates any legacy 'expense' types to 'expense_business' and explicitly broadens the check constraint to support all valid transaction types added across previous migrations.

-- Step 1: Migrate legacy data
UPDATE public.transactions SET type = 'expense_business' WHERE type = 'expense';

-- Step 2: Drop the existing constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Step 3: Re-add the constraint with all types from previous migrations
-- (income, expense_business, expense_personal, held_allocate, held_return, transfer)
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('income', 'expense_business', 'expense_personal', 'held_allocate', 'held_return', 'transfer'));
