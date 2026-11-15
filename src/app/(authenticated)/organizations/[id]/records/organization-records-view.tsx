"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Search, Filter, X, ArrowLeft, Plus, SlidersHorizontal } from "lucide-react"
import {
  fetchTransactionsWithFilters,
  fetchTransactionAggregates,
  fetchOrganizationMembers,
  fetchOrganizationCategories,
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
import { TransactionsList } from "./transactions-list"
import { TransactionEditDialog } from "./transaction-edit-dialog"
import { FilteredStatsCard } from "./filtered-stats-card"
import { OrgTransactionDrawer } from "../org-transaction-drawer"
import type { FilteredStats } from "@/lib/finance-client"
import type { TransactionRecord } from "./utils"

type Transaction = TransactionRecord
type Member = {
  id: string
  name: string
  role: string
}
type Category = {
  id: string
  normalized_name: string
  aliases?: string[]
}

const TRANSACTION_TYPES = [
  { value: "income", label: "Income" },
  { value: "expense_business", label: "Business Expense" },
  { value: "expense_personal", label: "Personal Expense" },
  { value: "held_allocate", label: "Held Allocation" },
  { value: "held_return", label: "Held Return" },
  { value: "transfer", label: "Transfer" },
]

const QUICK_TYPE_PILLS = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense_business", label: "Business Exp" },
  { value: "expense_personal", label: "Personal Exp" },
  { value: "held_return", label: "Refund / Return" },
]

type RecordsPageContentProps = {
  currency?: string
  userRole?: string
}

export function OrganizationRecordsView({ currency, userRole }: RecordsPageContentProps) {
  const router = useRouter()
  const params = useParams()
  const organizationId = params.id as string

  const canManage = !userRole || userRole === "owner" || userRole === "admin"

  // Filter states
  const [searchText, setSearchText] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedMember, setSelectedMember] = useState("all")
  const [fundedByType, setFundedByType] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true)

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<FilteredStats | null>(null)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  // Add & Edit dialog states
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Intersection observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null)

  // Load initial filter data (members, categories)
  useEffect(() => {
    async function loadFilters() {
      const [membersData, categoriesData] = await Promise.all([
        fetchOrganizationMembers(organizationId),
        fetchOrganizationCategories(organizationId),
      ])
      setMembers(membersData)
      setCategories(categoriesData)
    }
    loadFilters()
  }, [organizationId])

  const getFilterParams = useCallback(() => ({
    searchText,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    type: selectedType === 'all' ? undefined : selectedType,
    memberId: selectedMember === 'all' ? undefined : selectedMember,
    fundedByType: fundedByType === 'all' ? undefined : (fundedByType as 'business' | 'personal'),
    startDate,
    endDate,
  }), [searchText, selectedCategory, selectedType, selectedMember, fundedByType, startDate, endDate])

  // Load transactions
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

      if (!append) {
        setIsStatsLoading(true)
        const aggregates = await fetchTransactionAggregates(organizationId, filters)
        setStats(aggregates)
        setIsStatsLoading(false)
      }
    },
    [organizationId, getFilterParams, nextCursor]
  )

  // Load transactions and server aggregates on filter change
  useEffect(() => {
    let ignore = false
    const filters = getFilterParams()

    void fetchTransactionsWithFilters(organizationId, {
      ...filters,
      limit: 20,
    }).then((result) => {
      if (!ignore) {
        setTransactions(result.transactions)
        setNextCursor(result.nextCursor)
        setHasMore(result.hasMore)
        setIsLoading(false)
      }
    })

    void fetchTransactionAggregates(organizationId, filters).then((aggregates) => {
      if (!ignore) {
        setStats(aggregates)
        setIsStatsLoading(false)
      }
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
    // Refresh transactions after edit/delete
    loadTransactions(false)
    handleCloseEdit()
  }

  const selectedMemberObj = members.find((m) => m.id === selectedMember)
  const selectedTypeObj = TRANSACTION_TYPES.find((t) => t.value === selectedType)

  const activeFilters = [
    searchText && { label: `Search: ${searchText}`, key: "search" },
    selectedCategory && selectedCategory !== 'all' && { label: `Category: ${selectedCategory}`, key: "category" },
    selectedType && selectedType !== 'all' && { label: `Type: ${selectedTypeObj?.label || selectedType}`, key: "type" },
    selectedMember && selectedMember !== 'all' && { label: `Member: ${selectedMemberObj?.name || selectedMember}`, key: "member" },
    fundedByType && fundedByType !== 'all' && { label: `Funded: ${fundedByType === 'business' ? 'Business' : 'Personal'}`, key: "fundedBy" },
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
      case "member":
        setSelectedMember("all")
        break
      case "fundedBy":
        setFundedByType("all")
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
    setSelectedMember("all")
    setFundedByType("all")
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

      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaction Records</h1>
          <p className="text-muted-foreground mt-1">View, search, and manage all transactions</p>
        </div>

        {canManage && (
          <Button
            onClick={() => setIsAddDrawerOpen(true)}
            className="gap-2 shrink-0 self-start sm:self-auto shadow-xs"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Transaction
          </Button>
        )}
      </div>

      {/* Filtered Stats Card */}
      <FilteredStatsCard
        stats={stats}
        isLoading={isStatsLoading && !stats}
        currency={currency}
      />

      {/* Command & Filter Bar */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-4">
        {/* Search + Quick Type Pills + Collapse Toggle */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              placeholder="Search transactions by description or category..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchText && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchText("")}
                className="absolute right-2.5 top-2.5 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_TYPE_PILLS.map((pill) => {
              const active = selectedType === pill.value
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setSelectedType(pill.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-accent-strong bg-accent/15 text-accent-strong font-semibold"
                      : "border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {pill.label}
                </button>
              )
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className="ml-auto sm:ml-1 h-7 gap-1.5 rounded-full px-3 text-xs"
            >
              <SlidersHorizontal className="h-3 w-3" aria-hidden />
              <span>{showAdvancedFilters ? "Hide filters" : "More filters"}</span>
            </Button>
          </div>
        </div>

        {/* Detailed Filter Controls */}
        {showAdvancedFilters && (
          <div className="space-y-3 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Filters
                </span>
              </div>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-medium text-accent-strong hover:underline"
                >
                  Reset all ({activeFilters.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Category Filter */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                  Category
                </label>
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
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                  Type
                </label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {TRANSACTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Member Filter */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                  Member
                </label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="All members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All members</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Funded By Filter */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                  Funded By
                </label>
                <Select value={fundedByType} onValueChange={setFundedByType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                  From
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* End Date */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                  To
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center pt-1">
            {activeFilters.map((filter) => (
              <Badge
                key={filter.key}
                variant="secondary"
                className="flex items-center gap-1.5 rounded-full cursor-pointer hover:bg-muted px-3 py-1"
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
              className="h-7 rounded-full text-xs"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <TransactionsList
        transactions={transactions}
        organizationId={organizationId}
        isLoading={isLoading}
        isWallet={false}
        currency={currency}
        userRole={userRole}
        onEdit={handleEdit}
        onDelete={handleEditSave}
      />

      {/* Infinite scroll target */}
      <div ref={observerTarget} className="h-8 flex items-center justify-center">
        {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
        {!hasMore && transactions.length > 0 && (
          <div className="text-xs text-muted-foreground">All matching transactions loaded</div>
        )}
      </div>

      {/* Add Transaction Drawer */}
      {canManage && (
        <OrgTransactionDrawer
          organizationId={organizationId}
          currency={currency}
          initialTab="income"
          open={isAddDrawerOpen}
          onOpenChange={setIsAddDrawerOpen}
          onSuccess={() => {
            loadTransactions(false)
          }}
        />
      )}

      {/* Edit Dialog */}
      {editingTransaction && (
        <TransactionEditDialog
          key={editingTransaction.id}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          transaction={editingTransaction}
          organizationId={organizationId}
          onSave={handleEditSave}
          categories={categories}
        />
      )}
    </div>
  )
}
