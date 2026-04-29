/**
 * Client-side financial calculation utilities
 * These functions operate on transaction data without needing backend/server access
 */

export type FilteredStats = {
  totalAmount: number
  count: number
  byType: {
    income: number
    expense_business: number
    expense_personal: number
    held_allocate: number
    held_return: number
  }
  grossProfit: number
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
export function calculateFilteredStats(transactions: any[]): FilteredStats {
  let totalAmount = 0
  let count = 0
  const byType = {
    income: 0,
    expense_business: 0,
    expense_personal: 0,
    held_allocate: 0,
    held_return: 0,
  }

  for (const tx of transactions) {
    const amount = Number(tx.amount ?? 0)
    const type = tx.type as string

    totalAmount += amount
    count += 1

    if (type in byType) {
      byType[type as keyof typeof byType] += amount
    }
  }

  // Gross profit = income - business expenses (before salaries/personal)
  const grossProfit = byType.income - byType.expense_business

  return {
    totalAmount,
    count,
    byType,
    grossProfit,
  }
}

/**
 * Calculate period-based statistics (weekly or monthly)
 */
export function calculatePeriodStats(transactions: any[], periodType: "weekly" | "monthly"): PeriodStats {
  const now = new Date()
  let startDate: Date
  let endDate: Date

  if (periodType === "weekly") {
    // Get start of current week (Sunday)
    const dayOfWeek = now.getDay()
    startDate = new Date(now)
    startDate.setDate(now.getDate() - dayOfWeek)
    startDate.setHours(0, 0, 0, 0)

    // End of week (Saturday)
    endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    endDate.setHours(23, 59, 59, 999)
  } else {
    // Monthly - first day to last day of current month
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    startDate.setHours(0, 0, 0, 0)

    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    endDate.setHours(23, 59, 59, 999)
  }

  let income = 0
  let expenses = 0
  let count = 0

  function getTransactionDate(tx: any): Date | null {
    const rawDate = tx.occurred_at ?? tx.created_at
    if (!rawDate) return null

    const parsedDate = new Date(rawDate)
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  for (const tx of transactions) {
    const txDate = getTransactionDate(tx)

    if (!txDate) {
      continue
    }

    // Check if transaction is within the period
    if (txDate >= startDate && txDate <= endDate) {
      const amount = Number(tx.amount ?? 0)
      const type = tx.type as string

      if (type === "income") {
        income += amount
      } else if (type === "expense_business" || type === "expense_personal") {
        expenses += amount
      }
      // Note: held_allocate and held_return are not included in period stats

      count += 1
    }
  }

  const net = income - expenses

  return {
    periodType,
    startDate,
    endDate,
    income,
    expenses,
    net,
    transactionCount: count,
  }
}
