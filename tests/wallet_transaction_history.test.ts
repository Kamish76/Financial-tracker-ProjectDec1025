import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { calculateFilteredStats, calculatePeriodStats, type ClientTransaction } from '@/lib/finance-client'

const ROOT = path.resolve(__dirname, '..')

describe('Separation of Organization and Wallet Transaction History', () => {
  describe('1. Financial Stats Calculation for Wallets & Organizations', () => {
    it('calculates totalIncome, totalExpenses, netBalance, and tracks transfers correctly', () => {
      const mockTransactions: ClientTransaction[] = [
        { id: '1', amount: 5000, type: 'income' },
        { id: '2', amount: 1200, type: 'expense_personal' },
        { id: '3', amount: 300, type: 'expense' },
        { id: '4', amount: 500, type: 'transfer' },
      ]

      const stats = calculateFilteredStats(mockTransactions)

      expect(stats.totalIncome).toBe(5000)
      expect(stats.totalExpenses).toBe(1500)
      expect(stats.netBalance).toBe(3500)
      expect(stats.byType.transfer).toBe(500)
      expect(stats.count).toBe(4)
      expect(stats.totalAmount).toBe(7000)
    })

    it('calculates gross profit correctly for business organizations', () => {
      const mockTransactions: ClientTransaction[] = [
        { id: '1', amount: 10000, type: 'income' },
        { id: '2', amount: 3000, type: 'expense_business' },
      ]

      const stats = calculateFilteredStats(mockTransactions)
      expect(stats.grossProfit).toBe(7000)
    })
  })

  describe('2. Dispatcher Component (records-page-content.tsx)', () => {
    const recordsPath = path.join(
      ROOT,
      'src/app/(authenticated)/organizations/[id]/records/records-page-content.tsx'
    )
    const content = fs.readFileSync(recordsPath, 'utf8')

    it('cleanly renders WalletRecordsView for wallets and OrganizationRecordsView for organizations', () => {
      expect(content).toContain('if (isWallet) {')
      expect(content).toContain('<WalletRecordsView')
      expect(content).toContain('<OrganizationRecordsView')
    })
  })

  describe('3. Organization Records Setup (organization-records-view.tsx)', () => {
    const orgPath = path.join(
      ROOT,
      'src/app/(authenticated)/organizations/[id]/records/organization-records-view.tsx'
    )
    const content = fs.readFileSync(orgPath, 'utf8')

    it('preserves original Organization page title and subtitle', () => {
      expect(content).toContain('<h1 className="text-3xl font-bold text-foreground">Transaction Records</h1>')
      expect(content).toContain('<p className="text-muted-foreground mt-1">View, search, and manage all transactions</p>')
    })

    it('preserves Member and Funded By filters unconditionally without wallet dependencies', () => {
      expect(content).toContain('{/* Member Filter */}')
      expect(content).toContain('{/* Funded By Filter */}')
      expect(content).not.toContain('!walletSummary?.isWallet')
      expect(content).not.toContain('{/* Account Filter */}')
      expect(content).not.toContain('<WalletTotalBalanceCard')
    })

    it('passes isWallet={false} to TransactionsList so Member and Funded By columns are always rendered', () => {
      expect(content).toContain('isWallet={false}')
    })

    it('uses FilteredStatsCard with 4 cards (Total Income, Total Expenses, Gross Profit, Transaction Count)', () => {
      expect(content).toContain('<FilteredStatsCard')
      const cardPath = path.join(
        ROOT,
        'src/app/(authenticated)/organizations/[id]/records/filtered-stats-card.tsx'
      )
      const cardContent = fs.readFileSync(cardPath, 'utf8')
      expect(cardContent).toContain('label: "Total Income"')
      expect(cardContent).toContain('label: "Total Expenses"')
      expect(cardContent).toContain('label: "Transaction Count"')
      expect(cardContent).toContain('label: "Gross Profit"')
    })

    it('uses TransactionsList with Member, Funded By, and role-gated actions', () => {
      expect(content).toContain('<TransactionsList')
      const listPath = path.join(
        ROOT,
        'src/app/(authenticated)/organizations/[id]/records/transactions-list.tsx'
      )
      const listContent = fs.readFileSync(listPath, 'utf8')
      expect(listContent).toContain('th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>')
      expect(listContent).toContain('th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Funded By</th>')
      expect(listContent).toContain('canManage')
    })

    it('does not render WalletFab or AddTransactionModal in organization mode', () => {
      expect(content).not.toContain('<WalletFab')
      expect(content).not.toContain('<AddTransactionModal')
    })
  })

  describe('3.1 Robust Member and Category Resolution (utils.ts)', () => {
    const utilsPath = path.join(
      ROOT,
      'src/app/(authenticated)/organizations/[id]/records/utils.ts'
    )
    const content = fs.readFileSync(utilsPath, 'utf8')

    it('fetchOrganizationMembers includes owner and active members without PostgREST relationship ambiguity', () => {
      expect(content).toContain(".from('organizations')")
      expect(content).toContain(".select('owner_id')")
      expect(content).toContain(".from('organization_members')")
      expect(content).toContain(".from('profiles')")
      expect(content).toContain("userRoleMap.set(org.owner_id, 'owner')")
      // Does not use ambiguous nested join user:profiles on organization_members
      expect(content).not.toContain("user:profiles(id, full_name, avatar_url)")
    })

    it('fetchOrganizationCategories checks both transaction_categories and transactions', () => {
      expect(content).toContain(".from('transaction_categories')")
      expect(content).toContain(".from('transactions')")
    })
  })

  describe('4. Wallet Records Setup (wallet-records-view.tsx)', () => {
    const walletPath = path.join(
      ROOT,
      'src/app/(authenticated)/organizations/[id]/records/wallet-records-view.tsx'
    )
    const content = fs.readFileSync(walletPath, 'utf8')

    it('curates page title and subtitle for wallet mode', () => {
      expect(content).toContain('<h1 className="text-3xl font-bold text-foreground">Wallet Transaction History</h1>')
      expect(content).toContain(
        '<p className="text-muted-foreground mt-1">\n            View, search, and manage transactions across your wallet accounts\n          </p>'
      )
    })

    it('renders Add Transaction button in header and renders Account filter', () => {
      expect(content).toContain('Add Transaction')
      expect(content).toContain('{/* Account Filter */}')
    })

    it('does not render Member or Funded By filters in wallet mode', () => {
      expect(content).not.toContain('{/* Member Filter */}')
      expect(content).not.toContain('{/* Funded By Filter */}')
    })

    it('uses WalletFilteredStatsCard with 4 cards (Total Income, Total Expenses, Net Balance, Count)', () => {
      expect(content).toContain('<WalletFilteredStatsCard')
      const cardPath = path.join(
        ROOT,
        'src/app/(authenticated)/organizations/[id]/records/wallet-filtered-stats-card.tsx'
      )
      const cardContent = fs.readFileSync(cardPath, 'utf8')
      expect(cardContent).toContain('label: "Total Income"')
      expect(cardContent).toContain('label: "Total Expenses"')
      expect(cardContent).toContain('label: "Net Balance"')
      expect(cardContent).toContain('label: "Transaction Count"')
    })

    it('uses WalletTransactionsList omitting Member/Funded By and omitting Create Refund', () => {
      expect(content).toContain('<WalletTransactionsList')
      const listPath = path.join(
        ROOT,
        'src/app/(authenticated)/organizations/[id]/records/wallet-transactions-list.tsx'
      )
      const listContent = fs.readFileSync(listPath, 'utf8')
      expect(listContent).not.toContain('th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>')
      expect(listContent).not.toContain('th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Funded By</th>')
      expect(listContent).not.toContain('<DropdownMenuItem>Create Refund</DropdownMenuItem>')
    })

    it('renders WalletFab and AddTransactionModal', () => {
      expect(content).toContain('<WalletFab')
      expect(content).toContain('<AddTransactionModal')
    })

    it('uses decoupled server aggregates (fetchTransactionAggregates) and cursor lazy loading', () => {
      expect(content).toContain('fetchTransactionAggregates(organizationId, filters)')
      expect(content).toContain('fetchTransactionsWithFilters(organizationId, {\n      ...filters,\n      limit: 20,\n    })')
    })
  })

  describe('5. Add Transaction Modal Pre-fills Curation (add-transaction-modal.tsx)', () => {
    const modalPath = path.join(ROOT, 'src/components/wallet/add-transaction-modal.tsx')
    const content = fs.readFileSync(modalPath, 'utf8')

    it('defaults activeTab to expense and category to Food & Dining', () => {
      expect(content).toContain("useState<TabType>(initialTab || 'expense')")
      expect(content).toContain("useState<string>('Food & Dining')")
    })

    it('resets form state and pre-fills cleanly on modal open', () => {
      expect(content).toContain('useEffect(() => {\n    if (isOpen) {')
      expect(content).toContain("setDisplayExpr('0')")
      expect(content).toContain("setNotes('')")
      expect(content).toContain("const tab = initialTab || 'expense'")
    })
  })

  describe('6. Organization Main Page (page.tsx)', () => {
    const pagePath = path.join(ROOT, 'src/app/(authenticated)/organizations/[id]/page.tsx')
    const content = fs.readFileSync(pagePath, 'utf8')

    it('preserves original organization recent activity styling and curates wallet mode', () => {
      expect(content).toContain("isWallet ? 'Recent Wallet Activity' : 'Recent activity'")
      expect(content).toContain("formatAmount(tx.type, tx.amount, organization?.currency, isWallet)")
    })

    it('skips getOrganizationStats and limits recent transactions to 10 in wallet mode', () => {
      expect(content).toContain("if (isWallet) {")
      expect(content).toContain(".limit(10)")
      expect(content).toContain("gte('occurred_at', periodCutoff.toISOString())")
      expect(content).toContain("DashboardClientWrapper allTransactions={periodTransactions}")
    })
  })

  describe('7. Server Aggregates & Period Stats Calculation', () => {
    it('calculates period stats correctly with generic expense type', () => {
      const today = new Date().toISOString()
      const txs: ClientTransaction[] = [
        { id: '1', amount: 2000, type: 'income', occurred_at: today },
        { id: '2', amount: 450, type: 'expense', occurred_at: today },
        { id: '3', amount: 150, type: 'expense_personal', occurred_at: today },
      ]

      const monthlyStats = calculatePeriodStats(txs, 'monthly')
      expect(monthlyStats.income).toBe(2000)
      expect(monthlyStats.expenses).toBe(600)
      expect(monthlyStats.net).toBe(1400)
      expect(monthlyStats.transactionCount).toBe(3)
    })
  })
})
