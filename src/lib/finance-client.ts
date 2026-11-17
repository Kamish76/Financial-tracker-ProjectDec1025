/**
 * Client-side financial calculation utilities
 * These functions operate on transaction data without needing backend/server access
 */

export type ClientTransaction = {
  id?: string
  amount?: number | string | null
  type?: string | null
  category?: string | null
  occurred_at?: string | null
  created_at?: string | null
}

export type FilteredStats = {
  totalAmount: number
  count: number
  byType: {
    income: number
    expense_business: number
    expense_personal: number
    held_allocate: number
    held_return: number
    transfer: number
  }
  grossProfit: number
  netBalance: number
  totalIncome: number
  totalExpenses: number
}

export type PeriodStats = {
  periodType: "weekly" | "monthly"
  startDate: Date
  endDate: Date
  income: number
  expenses: number
  net: number
  transactionCount: number
}

/**
 * Calculate statistics for filtered transactions
 */
export function calculateFilteredStats(transactions: ClientTransaction[]): FilteredStats {
  let totalAmount = 0
  let count = 0
  const byType = {
    income: 0,
    expense_business: 0,
    expense_personal: 0,
    held_allocate: 0,
    held_return: 0,
    transfer: 0,
  }

  for (const tx of transactions) {
    const amount = Number(tx.amount ?? 0)
    const type = tx.type as string

    totalAmount += amount
    count += 1

    if (type in byType) {
      byType[type as keyof typeof byType] += amount
    } else if (type === 'expense') {
      byType.expense_personal += amount
    }
  }

  // Gross profit = income - business expenses (for organizations)
  const grossProfit = byType.income - byType.expense_business

  // Total income and expenses (including personal expenses for wallets)
  const totalIncome = byType.income
  const totalExpenses = byType.expense_personal + byType.expense_business
  const netBalance = totalIncome - totalExpenses

  return {
    totalAmount,
    count,
    byType,
    grossProfit,
    netBalance,
    totalIncome,
    totalExpenses,
  }
}

function getTransactionDate(tx: ClientTransaction): Date | null {
  const rawDate = tx.occurred_at ?? tx.created_at
  if (!rawDate) return null

  const parsedDate = new Date(rawDate)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

function getPeriodBounds(periodType: "weekly" | "monthly", offset: 0 | -1 = 0): { startDate: Date; endDate: Date } {
  const now = new Date()
  let startDate: Date
  let endDate: Date

  if (periodType === "weekly") {
    const dayOfWeek = now.getDay()
    startDate = new Date(now)
    startDate.setDate(now.getDate() - dayOfWeek + offset * 7)
    startDate.setHours(0, 0, 0, 0)

    endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    endDate.setHours(23, 59, 59, 999)
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    startDate.setHours(0, 0, 0, 0)

    endDate = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
    endDate.setHours(23, 59, 59, 999)
  }

  return { startDate, endDate }
}

function sumPeriodTransactions(
  transactions: ClientTransaction[],
  periodType: "weekly" | "monthly",
  offset: 0 | -1
): PeriodStats {
  const { startDate, endDate } = getPeriodBounds(periodType, offset)
  let income = 0
  let expenses = 0
  let count = 0

  for (const tx of transactions) {
    const txDate = getTransactionDate(tx)
    if (!txDate) continue

    if (txDate >= startDate && txDate <= endDate) {
      const amount = Number(tx.amount ?? 0)
      const type = tx.type as string

      if (type === "income") {
        income += amount
      } else if (type === "expense_business" || type === "expense_personal" || type === "expense") {
        expenses += amount
      }

      count += 1
    }
  }

  return {
    periodType,
    startDate,
    endDate,
    income,
    expenses,
    net: income - expenses,
    transactionCount: count,
  }
}

/**
 * Calculate period-based statistics (weekly or monthly)
 */
export function calculatePeriodStats(transactions: ClientTransaction[], periodType: "weekly" | "monthly"): PeriodStats {
  return sumPeriodTransactions(transactions, periodType, 0)
}

export type PeriodComparison = {
  current: PeriodStats
  previous: PeriodStats
  incomeDeltaPct: number | null
  expenseDeltaPct: number | null
  savingsRatePct: number | null
  dailyAvgSpend: number
  daysElapsed: number
}

function pctDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

/**
 * Compare current period against previous period and compute savings rate & daily average spend.
 */
export function calculatePeriodComparison(
  transactions: ClientTransaction[],
  periodType: "weekly" | "monthly"
): PeriodComparison {
  const current = sumPeriodTransactions(transactions, periodType, 0)
  const previous = sumPeriodTransactions(transactions, periodType, -1)

  const now = new Date()
  const msPerDay = 1000 * 60 * 60 * 24
  const daysElapsed = Math.max(
    1,
    Math.floor((now.getTime() - current.startDate.getTime()) / msPerDay) + 1
  )

  const savingsRatePct =
    current.income > 0 ? ((current.income - current.expenses) / current.income) * 100 : null

  return {
    current,
    previous,
    incomeDeltaPct: pctDelta(current.income, previous.income),
    expenseDeltaPct: pctDelta(current.expenses, previous.expenses),
    savingsRatePct,
    dailyAvgSpend: current.expenses / daysElapsed,
    daysElapsed,
  }
}

export type CategoryBreakdownItem = {
  category: string
  amount: number
  pct: number
}

/**
 * Aggregate top expense categories for the active period.
 */
export function calculateTopExpenseCategories(
  transactions: ClientTransaction[],
  periodType: "weekly" | "monthly",
  limit: number = 5
): { items: CategoryBreakdownItem[]; totalExpenses: number } {
  const { startDate, endDate } = getPeriodBounds(periodType, 0)
  const totals = new Map<string, number>()
  let totalExpenses = 0

  for (const tx of transactions) {
    const txDate = getTransactionDate(tx)
    if (!txDate || txDate < startDate || txDate > endDate) continue

    const type = tx.type as string
    if (type !== "expense_business" && type !== "expense_personal" && type !== "expense") continue

    const amount = Number(tx.amount ?? 0)
    if (!Number.isFinite(amount) || amount <= 0) continue

    const label = (tx.category ?? "").trim() || "Uncategorized"
    totals.set(label, (totals.get(label) ?? 0) + amount)
    totalExpenses += amount
  }

  const items = Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      pct: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)

  return { items, totalExpenses }
}
