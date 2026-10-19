"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Search, Filter, X, ArrowLeft, Plus } from "lucide-react"
import {
  fetchTransactionsWithFilters,
  fetchTransactionAggregates,
  fetchOrganizationCategories,
  fetchWalletSummary,
} from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WalletTransactionsList } from "./wallet-transactions-list"
import { WalletTransactionEditDialog } from "./wallet-transaction-edit-dialog"
import { WalletFilteredStatsCard } from "./wallet-filtered-stats-card"
import { WalletTotalBalanceCard } from "@/components/wallet/wallet-total-balance-card"
import { AddTransactionModal } from "@/components/wallet/add-transaction-modal"
import { WalletFab } from "@/components/wallet/wallet-fab"
import type { FilteredStats } from "@/lib/finance-client"
import type { TransactionRecord } from "./utils"
import type { AccountWithBalance } from "@/lib/wallet-types"

type Transaction = TransactionRecord
type WalletSummary = {
  isWallet: boolean
  accounts: AccountWithBalance[]
}
type Category = {
  id: string
  normalized_name: string
  aliases?: string[]
}

const WALLET_TRANSACTION_TYPES = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
]

type WalletRecordsViewProps = {
  currency?: string
}

export function WalletRecordsView({ currency }: WalletRecordsViewProps) {
  const router = useRouter()
  const params = useParams()
  const organizationId = params.id as string

  // Filter states
  const [searchText, setSearchText] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedAccount, setSelectedAccount] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null)
  const [stats, setStats] = useState<FilteredStats | null>(null)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  // Edit and Add dialog states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Intersection observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null)

  // Load initial filter data (categories, wallet summary)
  useEffect(() => {
    async function loadInitialData() {
      const [categoriesData, walletData] = await Promise.all([
        fetchOrganizationCategories(organizationId),
        fetchWalletSummary(organizationId),
      ])
      setCategories(categoriesData)
      setWalletSummary(walletData)
    }
    loadInitialData()
  }, [organizationId])

  const getFilterParams = useCallback(() => ({
    searchText,
    category: selectedCategory === "all" ? undefined : selectedCategory,
    type: selectedType === "all" ? undefined : selectedType,
    accountId: selectedAccount === "all" ? undefined : selectedAccount,
    startDate,
    endDate,
  }), [searchText, selectedCategory, selectedType, selectedAccount, startDate, endDate])

  // Load transactions (cursor-based lazy loading)
  const loadTransactions = useCallback(
    async (append = false) => {
      setIsLoading(true)

      const filters = getFilterParams()
      const result = await fetchTransactionsWithFilters(organizationId, {
        ...filters,
        cursor: append ? (nextCursor ?? undefined) : undefined,
        limit: 20,
      })

      setTransactions((prev) => (append ? [...prev, ...result.transactions] : result.transactions))
      setNextCursor(result.nextCursor)
      setHasMore(result.hasMore)
      setIsLoading(false)
    },
    [organizationId, getFilterParams, nextCursor]
  )

  // Refresh all (transactions, aggregates, wallet balances)
  const refreshAll = useCallback(async () => {
    setIsLoading(true)
    setIsStatsLoading(true)

    const filters = getFilterParams()
    const [txResult, aggregates, walletData] = await Promise.all([
      fetchTransactionsWithFilters(organizationId, {
        ...filters,
        limit: 20,
      }),
      fetchTransactionAggregates(organizationId, filters),
      fetchWalletSummary(organizationId),
    ])

    setTransactions(txResult.transactions)
    setNextCursor(txResult.nextCursor)
    setHasMore(txResult.hasMore)
    setStats(aggregates)
    setWalletSummary(walletData)
    setIsLoading(false)
    setIsStatsLoading(false)
  }, [organizationId, getFilterParams])

  // Load transactions and accurate server aggregates on filter change
  useEffect(() => {
    let ignore = false

    const filters = getFilterParams()

    // 1. Fetch first page of transactions (lazy loaded, 20 items)
    fetchTransactionsWithFilters(organizationId, {
      ...filters,
      limit: 20,
    })
      .then((result) => {
        if (!ignore) {
          setTransactions(result.transactions)
          setNextCursor(result.nextCursor)
          setHasMore(result.hasMore)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        console.error("[WalletRecordsView] fetchTransactions error:", err)
        if (!ignore) setIsLoading(false)
      })

    // 2. Fetch server aggregates across ALL matching records (accurate totals)
    fetchTransactionAggregates(organizationId, filters)
      .then((aggregates) => {
        if (!ignore) {
          setStats(aggregates)
          setIsStatsLoading(false)
        }
      })
      .catch((err) => {
        console.error("[WalletRecordsView] fetchTransactionAggregates error:", err)
        if (!ignore) setIsStatsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [organizationId, getFilterParams])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadTransactions(true)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoading, loadTransactions])

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowEditDialog(true)
  }

  const handleCloseEdit = () => {
    setShowEditDialog(false)
    setEditingTransaction(null)
  }

  const handleEditSave = async () => {
    await refreshAll()
    handleCloseEdit()
  }

  const activeFilters = [
    searchText && { label: `Search: ${searchText}`, key: "search" },
    selectedCategory && selectedCategory !== "all" && { label: `Category: ${selectedCategory}`, key: "category" },
    selectedType && selectedType !== "all" && { label: `Type: ${selectedType}`, key: "type" },
    selectedAccount && selectedAccount !== "all" && {
      label: `Account: ${walletSummary?.accounts.find((a) => a.id === selectedAccount)?.name || selectedAccount}`,
      key: "account",
    },
    startDate && { label: `From: ${startDate}`, key: "startDate" },
    endDate && { label: `To: ${endDate}`, key: "endDate" },
  ].filter(Boolean) as Array<{ label: string; key: string }>

  const clearFilter = (key: string) => {
    switch (key) {
      case "search":
        setSearchText("")
        break
      case "category":
        setSelectedCategory("all")
        break
      case "type":
        setSelectedType("all")
        break
      case "account":
        setSelectedAccount("all")
        break
      case "startDate":
        setStartDate("")
        break
      case "endDate":
        setEndDate("")
        break
    }
  }

  const clearAllFilters = () => {
    setSearchText("")
    setSelectedCategory("all")
    setSelectedType("all")
    setSelectedAccount("all")
    setStartDate("")
    setEndDate("")
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="-mt-2">
        <Button
          variant="ghost"
          onClick={() => router.push(`/organizations/${organizationId}`)}
          className="-ml-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Wallet Transaction History</h1>
          <p className="text-muted-foreground mt-1">
            View, search, and manage transactions across your wallet accounts
          </p>
        </div>
        {walletSummary?.accounts && walletSummary.accounts.length > 0 && (
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        )}
      </div>

      {/* Personal Wallet Current Total Balance Card */}
      {walletSummary?.accounts && (
        <WalletTotalBalanceCard
          organizationId={organizationId}
          accounts={walletSummary.accounts}
          currency={currency}
        />
      )}

      {/* Filtered Stats Card */}
      <WalletFilteredStatsCard
        stats={stats}
        isLoading={isStatsLoading}
        currency={currency}
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by notes or category..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.normalized_name}>
                    {cat.normalized_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {WALLET_TRANSACTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Account</label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue placeholder="All accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {(walletSummary?.accounts || []).map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">To</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            {activeFilters.map((filter) => (
              <Badge
                key={filter.key}
                variant="secondary"
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700"
                onClick={() => clearFilter(filter.key)}
              >
                {filter.label}
                <X className="h-3 w-3" />
              </Badge>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <WalletTransactionsList
        transactions={transactions}
        organizationId={organizationId}
        isLoading={isLoading}
        currency={currency}
        onEdit={handleEdit}
        onDelete={handleEditSave}
      />

      {/* Infinite scroll target */}
      <div ref={observerTarget} className="h-8 flex items-center justify-center">
        {isLoading && <div className="text-sm text-gray-500">Loading...</div>}
        {!hasMore && transactions.length > 0 && (
          <div className="text-sm text-gray-500">No more transactions</div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingTransaction && (
        <WalletTransactionEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          transaction={editingTransaction}
          organizationId={organizationId}
          onSave={handleEditSave}
          categories={categories}
          accounts={walletSummary?.accounts || []}
          currency={currency}
        />
      )}

      {/* Wallet Floating Action Button & Add Modal */}
      {walletSummary?.accounts && (
        <>
          <WalletFab
            organizationId={organizationId}
            accounts={walletSummary.accounts}
            currency={currency}
          />
          <AddTransactionModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            organizationId={organizationId}
            accounts={walletSummary.accounts}
            currency={currency}
            initialAccountId={selectedAccount !== "all" ? selectedAccount : undefined}
            onTransactionAdded={async () => {
              await refreshAll()
            }}
          />
        </>
      )}
    </div>
  )
}
