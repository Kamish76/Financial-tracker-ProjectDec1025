export type WalletAccount = {
  id: string
  organization_id: string
  name: string
  starting_value: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AccountWithBalance = WalletAccount & {
  current_balance: number
  transaction_count: number
}
