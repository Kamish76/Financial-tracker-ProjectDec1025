export const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts',
  'Other Income',
]

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Housing',
  'Transportation',
  'Utilities',
  'Other Expense',
]

export type CategoryItem = {
  id: string
  normalized_name: string
  display_name: string
  aliases: string[]
  is_custom: boolean
  type: 'income' | 'expense'
}
