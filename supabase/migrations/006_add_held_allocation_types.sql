-- Add new transaction types for baseline business held allocation
-- These types represent transfers from the organization pool to members
-- and do not affect org-level income/expense/cash totals

-- Drop existing constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add new constraint with held_allocate and held_return types
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('income', 'expense_business', 'expense_personal', 'held_allocate', 'held_return'));

-- Add comment explaining the new types
COMMENT ON COLUMN transactions.type IS 
  'Transaction type: income (revenue), expense_business (paid from business funds), expense_personal (paid personally, reimbursable), held_allocate (baseline allocation from org pool to member), held_return (return baseline allocation from member to org pool)';
