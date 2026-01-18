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

/**
 * Computes organization-level totals and per-member balances.
 * Uses the admin client after membership verification upstream.
 */
export async function getOrganizationStats(organizationId: string): Promise<OrganizationStats> {
  const admin = createAdminClient()

  // Aggregate income and expenses
  const { data: txRows, error: txError } = await admin
    .from('transactions')
    .select('type, amount, category, funded_by_type, funded_by_user_id, user_id')
    .eq('organization_id', organizationId)

  if (txError) {
    console.error('[finance] transactions aggregate error', { organizationId, error: txError.message })
  }

  const rows = txRows || []
  console.log('[finance] Loaded transactions:', {
    count: rows.length,
    sample: rows.slice(0, 3).map((r: any) => ({
      type: r.type,
      amount: r.amount,
      funded_by_type: r.funded_by_type,
      funded_by_user_id: r.funded_by_user_id
    }))
  })

  let totalIncome = 0
  let totalExpensesBusiness = 0
  let totalExpensesPersonal = 0
  let expensesCapital = 0

  for (const r of rows as any[]) {
    const amount = Number(r.amount ?? 0)
    const type = r.type as string
    const category = (r.category ?? '') as string

    // Exclude held_allocate/held_return from org totals (they only affect member balances)
    if (type === 'income') totalIncome += amount
    if (type === 'expense_business') totalExpensesBusiness += amount
    if (type === 'expense_personal') totalExpensesPersonal += amount
    if (category && category.toLowerCase() === 'capital') expensesCapital += amount
  }

  const actualExpensesWithoutCapital = totalExpensesBusiness + Math.max(totalExpensesPersonal - expensesCapital, 0)
  const cashOnHand = totalIncome - totalExpensesBusiness
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

  // Members
  const { data: members, error: membersError } = await admin
    .from('organization_members')
    .select('user_id, role, is_active')
    .eq('organization_id', organizationId)

  if (membersError) {
    console.error('[finance] members error', { organizationId, error: membersError.message })
  }

  // Try to attach emails for display if accessible
  const memberBalances: MemberBalance[] = []
  const userIds = (members || []).map((m) => m.user_id)

  let emailByUserId: Record<string, string | null> = {}
  if (userIds.length > 0) {
    try {
      // Use the admin auth API to list users
      const { data: { users }, error } = await admin.auth.admin.listUsers()
      
      if (!error && users) {
        // Filter to only the users we care about
        const relevantUsers = users.filter(u => userIds.includes(u.id))
        for (const u of relevantUsers) {
          emailByUserId[u.id] = u.email ?? null
        }
      }
    } catch (e) {
      console.error('[finance] Failed to fetch user emails:', e)
      emailByUserId = {}
    }
  }

  // Precompute per-user personal contributions (only personal-funded expenses)
  const contributionsByUser: Record<string, number> = {}
  for (const r of rows as any[]) {
    const amount = Number(r.amount ?? 0)
    const type = r.type as string
    const isPersonalFunded = (r.funded_by_type as string | null) === 'personal'
    const hasContributor = typeof r.funded_by_user_id === 'string'
    // Count only expenses that were personally funded
    if (isPersonalFunded && hasContributor && (type === 'expense_personal')) {
      const uid = r.funded_by_user_id as string
      contributionsByUser[uid] = (contributionsByUser[uid] ?? 0) + amount
    }
  }

  // Compute per-user business held: baseline allocation + income held - business expenses paid from held
  const businessHeldByUser: Record<string, number> = {}
  for (const r of rows as any[]) {
    const amount = Number(r.amount ?? 0)
    const type = r.type as string
    const isBusinessFunded = (r.funded_by_type as string | null) === 'business'
    const hasHolder = typeof r.funded_by_user_id === 'string'
    // No fallback for income - only explicitly assigned holders
    const holder = r.funded_by_user_id
    if (!holder) continue
    const uid = holder as string
    
    // Baseline allocations (always counted, regardless of funded_by_type)
    if (type === 'held_allocate') {
      businessHeldByUser[uid] = (businessHeldByUser[uid] ?? 0) + amount
      console.log('[finance] Allocation to:', { uid, amount, total: businessHeldByUser[uid] })
    } else if (type === 'held_return') {
      businessHeldByUser[uid] = (businessHeldByUser[uid] ?? 0) - amount
      console.log('[finance] Return from:', { uid, amount, total: businessHeldByUser[uid] })
    } else if (isBusinessFunded) {
      // Dynamic updates from business-funded transactions
      if (type === 'income') {
        businessHeldByUser[uid] = (businessHeldByUser[uid] ?? 0) + amount
        console.log('[finance] Income held by:', { uid, amount, total: businessHeldByUser[uid] })
      } else if (type === 'expense_business') {
        businessHeldByUser[uid] = (businessHeldByUser[uid] ?? 0) - amount
      }
    }
  }
  console.log('[finance] Final businessHeldByUser:', businessHeldByUser)

  // Sum reimbursements with status = 'paid'
  const { data: reimbursementRows, error: reimbError } = await admin
    .from('reimbursement_requests')
    .select('from_user_id, amount, status')
    .eq('organization_id', organizationId)
    .eq('status', 'paid')

  if (reimbError) {
    console.error('[finance] reimbursements error', { organizationId, error: reimbError.message })
  }

  const reimbByUser: Record<string, number> = {}
  for (const r of reimbursementRows || []) {
    const uid = r.from_user_id as string
    reimbByUser[uid] = (reimbByUser[uid] ?? 0) + Number(r.amount ?? 0)
  }

  for (const m of members || []) {
    const uid = m.user_id as string
    const contributedPersonal = contributionsByUser[uid] ?? 0
    const reimbursementsPaid = reimbByUser[uid] ?? 0
    const outstandingReimbursable = Math.max(contributedPersonal - reimbursementsPaid, 0)
    const businessHeld = businessHeldByUser[uid] ?? 0
    memberBalances.push({
      user_id: uid,
      email: emailByUserId[uid] ?? null,
      role: m.role ?? null,
      is_active: m.is_active ?? true,
      businessHeld,
      contributedPersonal,
      reimbursementsPaid,
      outstandingReimbursable,
    })
  }

  return {
    totals,
    members: memberBalances,
  }
}
