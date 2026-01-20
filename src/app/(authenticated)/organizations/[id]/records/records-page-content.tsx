"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Search, Filter, X } from "lucide-react"
import { fetchTransactionsWithFilters, fetchOrganizationMembers, fetchOrganizationCategories } from "./actions"
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

type Transaction = any
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
]

export function RecordsPageContent() {
  const params = useParams()
  const organizationId = params.id as string

  // Filter states
  const [searchText, setSearchText] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedMember, setSelectedMember] = useState("all")
  const [fundedByType, setFundedByType] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  // Edit dialog state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Intersection observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null)

  // Load initial filters
  useEffect(() => {
    const loadFilters = async () => {
      const [membersData, categoriesData] = await Promise.all([
        fetchOrganizationMembers(organizationId),
        fetchOrganizationCategories(organizationId),
      ])
      setMembers(membersData)
      setCategories(categoriesData)
    }
    loadFilters()
  }, [organizationId])

  // Load transactions
  const loadTransactions = useCallback(
    async (append = false) => {
      setIsLoading(true)

      const result = await fetchTransactionsWithFilters(organizationId, {
        searchText,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        type: selectedType === 'all' ? undefined : selectedType,
        memberId: selectedMember === 'all' ? undefined : selectedMember,
        fundedByType: fundedByType === 'all' ? undefined : (fundedByType as any),
        startDate,
        endDate,
        cursor: append ? nextCursor : undefined,
        limit: 20,
      })

      setTransactions((prev) => (append ? [...prev, ...result.transactions] : result.transactions))
      setNextCursor(result.nextCursor)
      setHasMore(result.hasMore)
      setIsLoading(false)
    },
    [
      organizationId,
      searchText,
      selectedCategory,
      selectedType,
      selectedMember,
      fundedByType,
      startDate,
      endDate,
      nextCursor,
    ]
  )

  // Load transactions on filter change
  useEffect(() => {
    loadTransactions(false)
  }, [searchText, selectedCategory, selectedType, selectedMember, fundedByType, startDate, endDate])

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
    // Refresh transactions after edit
    loadTransactions(false)
    handleCloseEdit()
  }

  const activeFilters = [
    searchText && { label: `Search: ${searchText}`, key: "search" },
    selectedCategory && selectedCategory !== 'all' && { label: `Category: ${selectedCategory}`, key: "category" },
    selectedType && selectedType !== 'all' && { label: `Type: ${selectedType}`, key: "type" },
    selectedMember && selectedMember !== 'all' && { label: `Member: ${selectedMember}`, key: "member" },
    fundedByType && fundedByType !== 'all' && { label: `Funded: ${fundedByType}`, key: "fundedBy" },
    startDate && { label: `From: ${startDate}`, key: "startDate" },
    endDate && { label: `To: ${endDate}`, key: "endDate" },
  ].filter(Boolean)

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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transaction Records</h1>
        <p className="text-muted-foreground mt-1">View, search, and manage all transactions</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search transactions by description or category..."
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
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Member</label>
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
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Funded By</label>
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
                key={filter!.key}
                variant="secondary"
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-300"
                onClick={() => clearFilter(filter!.key)}
              >
                {filter!.label}
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
      <TransactionsList
        transactions={transactions}
        organizationId={organizationId}
        isLoading={isLoading}
        onEdit={handleEdit}
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
        <TransactionEditDialog
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
