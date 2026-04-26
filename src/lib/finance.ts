import { createAdminClient } from '@/lib/supabase/server'

export type Totals = {
  totalIncome: number
  totalExpensesBusiness: number
  totalExpensesPersonal: number
  expensesCapital: number
  actualExpensesWithoutCapital: number
  cashOnHand: number
  actualExpensesVsIncome: number
}

export type MemberBalance = {
  user_id: string
  email?: string | null
  role?: string | null
  is_active?: boolean
  businessHeld: number
  contributedPersonal: number
  reimbursementsPaid: number
  outstandingReimbursable: number
}

export type OrganizationStats = {
  totals: Totals
  members: MemberBalance[]
}

type TransactionRow = {
  type: string
  amount: number | string | null
  category: string | null
  funded_by_type: string | null
  funded_by_user_id: string | null
}

type MemberRow = {
  user_id: string
  role: string | null
  is_active: boolean | null
}

type ReimbursementRow = {
  from_user_id: string
  amount: number | string | null
}

type AuthUserRow = {
  id: string
  email: string | null
}

/**
 * Computes organization-level totals and per-member balances.
 * Uses the admin client after membership verification upstream.
 */
export async function getOrganizationStats(organizationId: string): Promise<OrganizationStats> {
  const admin = createAdminClient()

  const [transactionsResult, membersResult, reimbursementsResult] = await Promise.all([
    admin
      .from('transactions')
      .select('type, amount, category, funded_by_type, funded_by_user_id')
      .eq('organization_id', organizationId),
    admin
      .from('organization_members')
      .select('user_id, role, is_active')
      .eq('organization_id', organizationId),
    admin
      .from('reimbursement_requests')
      .select('from_user_id, amount')
      .eq('organization_id', organizationId)
      .eq('status', 'paid'),
  ])

  if (transactionsResult.error) {
    console.error('[finance] transactions aggregate error', {
      organizationId,
      error: transactionsResult.error.message,
    })
  }

  if (membersResult.error) {
    console.error('[finance] members error', { organizationId, error: membersResult.error.message })
  }

  if (reimbursementsResult.error) {
    console.error('[finance] reimbursements error', {
      organizationId,
      error: reimbursementsResult.error.message,
    })
  }

  const transactions = (transactionsResult.data || []) as TransactionRow[]
  const members = (membersResult.data || []) as MemberRow[]
  const reimbursementRows = (reimbursementsResult.data || []) as ReimbursementRow[]

  let totalIncome = 0
  let totalExpensesBusiness = 0
  let totalExpensesPersonal = 0
  let expensesCapital = 0
  let totalRefundWithdrawals = 0

  for (const transaction of transactions) {
    const amount = Number(transaction.amount ?? 0)
    const type = transaction.type
    const category = transaction.category ?? ''

    if (type === 'income') totalIncome += amount
    if (type === 'expense_business') totalExpensesBusiness += amount
    if (type === 'expense_personal') totalExpensesPersonal += amount
    if (type === 'held_return' && category === 'Refund') totalRefundWithdrawals += amount
    if (category && category.toLowerCase() === 'capital') expensesCapital += amount
  }

  const actualExpensesWithoutCapital =
    totalExpensesBusiness + Math.max(totalExpensesPersonal - expensesCapital, 0)
  const cashOnHand = totalIncome - totalExpensesBusiness - totalRefundWithdrawals
  const actualExpensesVsIncome = totalIncome - actualExpensesWithoutCapital

  const totals: Totals = {
    totalIncome,
    totalExpensesBusiness,
    totalExpensesPersonal,
    expensesCapital,
    actualExpensesWithoutCapital,
    cashOnHand,
    actualExpensesVsIncome,
  }

  const userIds = members.map((member) => member.user_id)
  const emailByUserId: Record<string, string | null> = {}

  if (userIds.length > 0) {
    try {
      const { data, error } = await admin.auth.admin.listUsers()

      if (!error && data?.users) {
        for (const user of data.users as AuthUserRow[]) {
          if (userIds.includes(user.id)) {
            emailByUserId[user.id] = user.email
          }
        }
      }
    } catch (error) {
      console.error('[finance] Failed to fetch user emails:', error)
    }
  }

  const contributionsByUser: Record<string, number> = {}
  for (const transaction of transactions) {
    const amount = Number(transaction.amount ?? 0)
    if (
      transaction.funded_by_type === 'personal' &&
      typeof transaction.funded_by_user_id === 'string' &&
      transaction.type === 'expense_personal'
    ) {
      contributionsByUser[transaction.funded_by_user_id] =
        (contributionsByUser[transaction.funded_by_user_id] ?? 0) + amount
    }
  }

  const businessHeldByUser: Record<string, number> = {}
  for (const transaction of transactions) {
    const holder = transaction.funded_by_user_id
    if (!holder) continue

    const amount = Number(transaction.amount ?? 0)

    if (transaction.type === 'held_allocate') {
      businessHeldByUser[holder] = (businessHeldByUser[holder] ?? 0) + amount
    } else if (transaction.type === 'held_return') {
      businessHeldByUser[holder] = (businessHeldByUser[holder] ?? 0) - amount
    } else if (transaction.funded_by_type === 'business') {
      if (transaction.type === 'income') {
        businessHeldByUser[holder] = (businessHeldByUser[holder] ?? 0) + amount
      } else if (transaction.type === 'expense_business') {
        businessHeldByUser[holder] = (businessHeldByUser[holder] ?? 0) - amount
      }
    }
  }

  const reimbByUser: Record<string, number> = {}
  for (const reimbursement of reimbursementRows) {
    reimbByUser[reimbursement.from_user_id] =
      (reimbByUser[reimbursement.from_user_id] ?? 0) + Number(reimbursement.amount ?? 0)
  }

  const memberBalances = members.map((member) => {
    const contributedPersonal = contributionsByUser[member.user_id] ?? 0
    const reimbursementsPaid = reimbByUser[member.user_id] ?? 0

    return {
      user_id: member.user_id,
      email: emailByUserId[member.user_id] ?? null,
      role: member.role ?? null,
      is_active: member.is_active ?? true,
      businessHeld: businessHeldByUser[member.user_id] ?? 0,
      contributedPersonal,
      reimbursementsPaid,
      outstandingReimbursable: Math.max(contributedPersonal - reimbursementsPaid, 0),
    }
  })

  return {
    totals,
    members: memberBalances,
  }
}
