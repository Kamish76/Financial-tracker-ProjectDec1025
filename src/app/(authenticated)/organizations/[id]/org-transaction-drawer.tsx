"use client"

import React, { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  RefreshCw,
  Tag,
  UserCheck,
  Wallet,
} from "lucide-react"

import { addExpense, addIncome, createRefund } from "./actions"
import { getOrganizationCategoriesByType } from "@/lib/categories"
import { isWalletOrganization } from "@/lib/wallet"
import { supabase } from "@/lib/supabaseClient"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export type OrgDrawerTab = "income" | "expense" | "refund"

export type OrgTransactionDrawerProps = {
  organizationId: string
  currency?: string
  organizationDescription?: string | null
  initialTab?: OrgDrawerTab
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSuccess?: () => void
}

const ORG_INCOME_PRESETS = [
  "Sales",
  "Sponsorship",
  "Donations",
  "Membership Dues",
  "Grants",
  "Other Income",
]

const ORG_EXPENSE_PRESETS = [
  "Supplies",
  "Equipment",
  "Venue & Events",
  "Marketing",
  "Utilities",
  "Software",
  "Capital",
]

const QUICK_INCREMENTS = [50, 100, 500, 1000]

function getCurrencySymbol(currencyCode?: string): string {
  const safeCurrency = currencyCode && currencyCode.trim() ? currencyCode.trim().toUpperCase() : "USD"
  try {
    const part = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
    })
      .formatToParts(0)
      .find((p) => p.type === "currency")
    return part?.value || safeCurrency
  } catch {
    return "$"
  }
}

function mergeCategoryOptions(dbNames: string[], presets: string[]): string[] {
  const seen = new Set<string>()
  const merged: string[] = []
  for (const name of [...dbNames, ...presets]) {
    const trimmed = name.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(trimmed)
    }
  }
  return merged.slice(0, 10)
}

export function OrgTransactionDrawer({
  organizationId,
  currency,
  organizationDescription,
  initialTab = "income",
  open: controlledOpen,
  onOpenChange,
  trigger,
  onSuccess,
}: OrgTransactionDrawerProps) {
  const router = useRouter()
  const isWallet = isWalletOrganization(organizationDescription)
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = isControlled ? controlledOpen : internalOpen

  const resolveTab = (tab: OrgDrawerTab): OrgDrawerTab =>
    isWallet && tab === "refund" ? "expense" : tab

  const [activeTab, setActiveTab] = useState<OrgDrawerTab>(() => resolveTab(initialTab))
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [occurredAt, setOccurredAt] = useState("")
  const [expenseType, setExpenseType] = useState<"business" | "personal">(
    isWallet ? "personal" : "business"
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Income holder info
  const [fundedByUserId, setFundedByUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)

  // Refund 2-step confirmation
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationAmount, setConfirmationAmount] = useState<number | null>(null)

  // Organization category suggestions
  const [dbCategories, setDbCategories] = useState<{
    income: string[]
    expense: string[]
  }>({ income: [], expense: [] })

  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency])
  const currencyCode = useMemo(
    () => (currency && currency.trim() ? currency.trim().toUpperCase() : "USD"),
    [currency]
  )

  // Auto-clear error after 30s
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 30000)
    return () => clearTimeout(timer)
  }, [error])

  // Load current user & org categories when drawer opens
  useEffect(() => {
    if (!isOpen) return
    let mounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      const u = data.user
      const name =
        (u?.user_metadata?.full_name as string | undefined) ||
        (u?.email as string | undefined) ||
        null
      setCurrentUserName(name)
      if (u?.id) {
        setFundedByUserId((prev) => prev ?? u.id)
      }
    })

    if (organizationId) {
      getOrganizationCategoriesByType(organizationId)
        .then((res) => {
          if (!mounted) return
          setDbCategories({
            income: res.income.map((c) => c.display_name || c.normalized_name),
            expense: res.expense.map((c) => c.display_name || c.normalized_name),
          })
        })
        .catch(() => {})
    }

    return () => {
      mounted = false
    }
  }, [isOpen, organizationId])

  const resetForm = () => {
    setActiveTab(resolveTab(initialTab))
    setAmount("")
    setCategory("")
    setDescription("")
    setOccurredAt("")
    setError(null)
    setExpenseType(isWallet ? "personal" : "business")
    setFundedByUserId(null)
    setShowConfirmation(false)
    setConfirmationAmount(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setActiveTab(resolveTab(initialTab))
      setError(null)
      setShowConfirmation(false)
      setConfirmationAmount(null)
    } else {
      resetForm()
    }
    if (!isControlled) {
      setInternalOpen(next)
    }
    onOpenChange?.(next)
  }

  const handleTabSwitch = (nextTab: OrgDrawerTab) => {
    setActiveTab(nextTab)
    setError(null)
    setShowConfirmation(false)
    setConfirmationAmount(null)
  }

  const handleIncrementAmount = (delta: number) => {
    setError(null)
    const current = Number(amount)
    const base = Number.isFinite(current) && current > 0 ? current : 0
    const nextVal = Number((base + delta).toFixed(2))
    setAmount(String(nextVal))
  }

  const categorySuggestions = useMemo(() => {
    if (activeTab === "income") {
      return mergeCategoryOptions(dbCategories.income, ORG_INCOME_PRESETS)
    }
    return mergeCategoryOptions(dbCategories.expense, ORG_EXPENSE_PRESETS)
  }, [activeTab, dbCategories])

  const accentConfig = useMemo(() => {
    if (activeTab === "income") {
      return {
        label: "Log Income",
        subtitle: "Record revenue or incoming funds held by you.",
        ringClass: "focus-within:border-emerald-500/60 focus-within:ring-emerald-500/20",
        badgeClass: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
        chipActiveClass: "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold",
        submitClass: "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
      }
    }
    if (activeTab === "expense") {
      const isPersonal = isWallet || expenseType === "personal"
      return {
        label: isWallet ? "Log Wallet Expense" : "Log Expense",
        subtitle: isPersonal
          ? "Out-of-pocket expense tracked for reimbursement."
          : "Business expense paid from organization funds you hold.",
        ringClass: isPersonal
          ? "focus-within:border-amber-500/60 focus-within:ring-amber-500/20"
          : "focus-within:border-rose-500/60 focus-within:ring-rose-500/20",
        badgeClass: isPersonal
          ? "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25"
          : "bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/25",
        chipActiveClass: isPersonal
          ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold"
          : "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold",
        submitClass: isPersonal
          ? "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
          : "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500",
      }
    }
    return {
      label: "Record Refund",
      subtitle: "Reimburse your outstanding personal contributions.",
      ringClass: "focus-within:border-purple-500/60 focus-within:ring-purple-500/20",
      badgeClass: "bg-purple-500/12 text-purple-700 dark:text-purple-300 border-purple-500/25",
      chipActiveClass: "border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold",
      submitClass: "bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500",
    }
  }, [activeTab, expenseType, isWallet])

  const closeAndNotify = () => {
    resetForm()
    if (!isControlled) {
      setInternalOpen(false)
    }
    onOpenChange?.(false)
    onSuccess?.()
    router.refresh()
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0")
      return
    }

    if (activeTab === "refund") {
      setConfirmationAmount(parsedAmount)
      setShowConfirmation(true)
      return
    }

    const dateValue = occurredAt || defaultDate
    if (!dateValue) {
      setError("Date is required")
      return
    }

    startTransition(async () => {
      if (activeTab === "income") {
        const result = await addIncome({
          organizationId,
          amount: parsedAmount,
          category: category.trim() || undefined,
          description: description.trim() || undefined,
          occurredAt: dateValue,
          fundedByType: "business",
          fundedByUserId: fundedByUserId || undefined,
        })

        if (result && "error" in result) {
          setError(result.error ?? "Unable to save income")
          return
        }

        closeAndNotify()
        return
      }

      const result = await addExpense({
        organizationId,
        amount: parsedAmount,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        occurredAt: dateValue,
        expenseType: isWallet ? "personal" : expenseType,
      })

      if (result && "error" in result) {
        setError(result.error ?? "Unable to save expense")
        return
      }

      closeAndNotify()
    })
  }

  const handleConfirmRefund = () => {
    if (confirmationAmount === null) return
    setError(null)

    startTransition(async () => {
      const result = await createRefund({
        organizationId,
        amount: confirmationAmount,
        description: description.trim() || undefined,
      })

      if (result && "error" in result) {
        setError(result.error ?? "Unable to process refund")
        setShowConfirmation(false)
        setConfirmationAmount(null)
        return
      }

      closeAndNotify()
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}

      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto p-0 border-l border-r-0 flex flex-col"
      >
        {/* Sticky Drawer Header with Mode Switcher */}
        <div className="border-b border-border/70 bg-card/95 px-6 pt-6 pb-5 space-y-4">
          <SheetHeader className="text-left pr-6">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${accentConfig.badgeClass}`}
              >
                {currencyCode}
              </span>
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight">
              {accentConfig.label}
            </SheetTitle>
            <SheetDescription>{accentConfig.subtitle}</SheetDescription>
          </SheetHeader>

          {/* Segmented Mode Switcher */}
          <div
            role="tablist"
            aria-label="Transaction type"
            className={`grid gap-1.5 rounded-xl border border-border/70 bg-muted/70 p-1 ${
              isWallet ? "grid-cols-2" : "grid-cols-3"
            }`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "income"}
              onClick={() => handleTabSwitch("income")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                activeTab === "income"
                  ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden />
              <span>Income</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "expense"}
              onClick={() => handleTabSwitch("expense")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                activeTab === "expense"
                  ? "bg-card text-rose-600 dark:text-rose-400 shadow-xs ring-1 ring-rose-500/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              <span>Expense</span>
            </button>

            {!isWallet && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "refund"}
                onClick={() => handleTabSwitch("refund")}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  activeTab === "refund"
                    ? "bg-card text-purple-600 dark:text-purple-400 shadow-xs ring-1 ring-purple-500/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                <span>Refund</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Drawer Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between p-6 space-y-6">
          <div className="space-y-5">
            {/* Inline Refund Confirmation Step */}
            {activeTab === "refund" && showConfirmation && confirmationAmount !== null ? (
              <div className="space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                      Confirm Refund Withdrawal
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This will immediately record a reimbursement withdrawal and deduct from your outstanding personal balance.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Refund amount</span>
                  <div className="font-mono text-3xl font-extrabold tabular-nums text-foreground">
                    {formatCurrency(confirmationAmount, currency)}
                  </div>
                </div>

                {description.trim() && (
                  <div className="rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 space-y-0.5">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Notes
                    </span>
                    <p className="text-sm text-foreground">{description.trim()}</p>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Hero Amount Card */}
                <div
                  className={`rounded-2xl border border-border/80 bg-muted/25 p-4 space-y-3 transition-all focus-within:ring-2 ${accentConfig.ringClass}`}
                >
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="org-drawer-amount"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Amount
                    </Label>
                    {amount && Number(amount) > 0 && (
                      <span className="font-mono text-xs font-medium text-muted-foreground">
                        {formatCurrency(Number(amount), currency)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border px-3 font-mono text-lg font-bold ${accentConfig.badgeClass}`}
                    >
                      {currencySymbol}
                    </span>
                    <input
                      id="org-drawer-amount"
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value)
                        setError(null)
                      }}
                      className="w-full bg-transparent font-mono text-3xl font-extrabold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                    />
                  </div>

                  {/* Quick-increment chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50">
                    {QUICK_INCREMENTS.map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => handleIncrementAmount(inc)}
                        className="rounded-lg border border-border/70 bg-card px-2.5 py-1 font-mono text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        +{inc.toLocaleString()}
                      </button>
                    ))}
                    {amount && (
                      <button
                        type="button"
                        onClick={() => setAmount("")}
                        className="ml-auto rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Income Holder Banner */}
                {activeTab === "income" && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                        <UserCheck className="h-4 w-4" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Funds Holder
                        </p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {currentUserName ? `Me (${currentUserName})` : "Me"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 shrink-0">
                      Business Cash
                    </span>
                  </div>
                )}

                {/* Visual Fund-Source Cards for Expenses */}
                {activeTab === "expense" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Funded By
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={isWallet}
                        onClick={() => !isWallet && setExpenseType("business")}
                        className={`flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all ${
                          expenseType === "business" && !isWallet
                            ? "border-rose-500/60 bg-rose-500/[0.07] ring-1 ring-rose-500/30"
                            : "border-border/70 bg-card hover:bg-muted/50 disabled:opacity-45 disabled:cursor-not-allowed"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/12 text-rose-600 dark:text-rose-400">
                            <Building2 className="h-4 w-4" aria-hidden />
                          </div>
                          {expenseType === "business" && !isWallet && (
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Business Treasury</p>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                            Paid from org funds you hold
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpenseType("personal")}
                        className={`flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all ${
                          isWallet || expenseType === "personal"
                            ? "border-amber-500/60 bg-amber-500/[0.08] ring-1 ring-amber-500/30"
                            : "border-border/70 bg-card hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <Wallet className="h-4 w-4" aria-hidden />
                          </div>
                          {(isWallet || expenseType === "personal") && (
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Out-of-Pocket</p>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                            Personal funds · Reimbursable
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Refund Info Banner */}
                {activeTab === "refund" && (
                  <div className="rounded-xl border border-purple-500/25 bg-purple-500/[0.06] px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                    Record a refund for your outstanding personal contributions. You will confirm the exact amount before your balance is deducted.
                  </div>
                )}

                {/* Category Chips + Input (Income & Expense) */}
                {activeTab !== "refund" && (
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="org-drawer-category"
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      <Tag className="h-3.5 w-3.5" aria-hidden />
                      <span>Category</span>
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {categorySuggestions.map((cat) => {
                        const isSelected = category.trim().toLowerCase() === cat.toLowerCase()
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(isSelected ? "" : cat)}
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                              isSelected
                                ? accentConfig.chipActiveClass
                                : "border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {cat}
                          </button>
                        )
                      })}
                    </div>
                    <Input
                      id="org-drawer-category"
                      name="category"
                      placeholder={
                        activeTab === "income"
                          ? "Or type custom category (e.g. Merch Sales)"
                          : "Or type custom category (e.g. Catering, Capital)"
                      }
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </div>
                )}

                {/* Date & Description */}
                <div className="grid gap-4">
                  {activeTab !== "refund" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="org-drawer-date"
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        <Calendar className="h-3.5 w-3.5" aria-hidden />
                        <span>Date</span>
                      </Label>
                      <Input
                        id="org-drawer-date"
                        name="occurredAt"
                        type="date"
                        required
                        value={occurredAt || defaultDate}
                        onChange={(e) => setOccurredAt(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="org-drawer-description"
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden />
                      <span>
                        {activeTab === "refund" ? "Description (Optional)" : "Description / Note"}
                      </span>
                    </Label>
                    <Input
                      id="org-drawer-description"
                      name="description"
                      placeholder={
                        activeTab === "refund"
                          ? "e.g. Reimbursed via bank transfer or check"
                          : "Optional details about this transaction"
                      }
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{error}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sticky Footer Actions */}
          <div className="pt-4 border-t border-border/70 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            {activeTab === "refund" && showConfirmation ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => {
                    setShowConfirmation(false)
                    setConfirmationAmount(null)
                  }}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={handleConfirmRefund}
                  className={accentConfig.submitClass}
                >
                  {isPending ? "Processing..." : "Confirm Refund"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || (activeTab === "refund" && !amount)}
                  className={accentConfig.submitClass}
                >
                  {isPending
                    ? "Saving..."
                    : activeTab === "income"
                    ? "Save Income"
                    : activeTab === "expense"
                    ? "Save Expense"
                    : "Review Refund"}
                </Button>
              </>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
