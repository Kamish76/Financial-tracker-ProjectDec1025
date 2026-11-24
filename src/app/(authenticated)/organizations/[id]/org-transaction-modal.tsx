'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Check,
  Building2,
  User,
  Tag,
  Delete,
  Calendar,
  Clock,
  RefreshCw,
  Plus,
  AlertCircle,
  Briefcase,
  Settings2,
  Wallet,
  ChevronDown,
} from 'lucide-react'

import { addIncome, addExpense, createRefund } from './actions'
import { getUserMirrorableWalletAccounts } from '@/lib/wallet-accounts'
import type { MirrorWalletContext } from '@/lib/wallet-types'
import { ManageCategoriesDialog } from './settings/manage-categories-dialog'
import { getOrganizationCategoriesByType } from '@/lib/categories'
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
} from '@/lib/category-constants'
import { isWalletOrganization } from '@/lib/wallet'
import { supabase } from '@/lib/supabaseClient'
import { formatCurrency, evaluateMathExpression, formatLocalDateInput } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type OrgTransactionTab = 'income' | 'expense' | 'refund'

type OrgTransactionModalProps = {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  organizationDescription?: string | null
  currency?: string
  initialTab?: OrgTransactionTab
  onTransactionAdded?: () => void
}

export function OrgTransactionModal({
  isOpen,
  onClose,
  organizationId,
  organizationDescription,
  currency,
  initialTab = 'expense',
  onTransactionAdded,
}: OrgTransactionModalProps) {
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusedElementRef = useRef<HTMLElement | null>(null)
  const isWallet = isWalletOrganization(organizationDescription)

  const [activeTab, setActiveTab] = useState<OrgTransactionTab>(initialTab)
  const [fundedByType, setFundedByType] = useState<'business' | 'personal'>('business')
  const [fundedByUserId, setFundedByUserId] = useState<string | null>(null)
  const [expenseType, setExpenseType] = useState<'business' | 'personal'>(
    isWallet ? 'personal' : 'business'
  )

  const [category, setCategory] = useState<string>('Food & Dining')
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('')
  const [orgCategories, setOrgCategories] = useState<{
    income: string[]
    expense: string[]
  }>({
    income: DEFAULT_INCOME_CATEGORIES,
    expense: DEFAULT_EXPENSE_CATEGORIES,
  })

  const [showTypeDropdown, setShowTypeDropdown] = useState<boolean>(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false)
  const [showMirrorDropdown, setShowMirrorDropdown] = useState<boolean>(false)
  const [mirrorContext, setMirrorContext] = useState<MirrorWalletContext | null>(null)
  const [mirrorWalletAccountId, setMirrorWalletAccountId] = useState<string>('')
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState<boolean>(false)
  const [notes, setNotes] = useState<string>('')
  const [displayExpr, setDisplayExpr] = useState<string>('0')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showRefundConfirm, setShowRefundConfirm] = useState<boolean>(false)

  const [txDate, setTxDate] = useState<string>(
    () => formatLocalDateInput(new Date().toISOString())
  )
  const [txTime, setTxTime] = useState<string>(
    () => new Date().toTimeString().split(' ')[0].substring(0, 5)
  )

  // Lock body scroll and manage focus when modal is open
  useEffect(() => {
    if (!isOpen) return

    previousFocusedElementRef.current = document.activeElement as HTMLElement | null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        )
        if (focusable.length > 0) {
          focusable[0].focus()
        } else {
          modalRef.current.focus()
        }
      }
    }, 0)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = originalOverflow
      if (
        previousFocusedElementRef.current &&
        typeof previousFocusedElementRef.current.focus === 'function'
      ) {
        previousFocusedElementRef.current.focus()
      }
    }
  }, [isOpen])

  const refreshCategories = useCallback(async () => {
    if (!organizationId) return
    try {
      const res = await getOrganizationCategoriesByType(organizationId)
      const incomeNames = res.income.map((c) => c.display_name || c.normalized_name)
      const expenseNames = res.expense.map((c) => c.display_name || c.normalized_name)
      setOrgCategories({
        income: incomeNames.length > 0 ? incomeNames : DEFAULT_INCOME_CATEGORIES,
        expense: expenseNames.length > 0 ? expenseNames : DEFAULT_EXPENSE_CATEGORIES,
      })
    } catch {
      // Ignore transient fetch errors
    }
  }, [organizationId])

  // Load current user, organization categories, and optional wallet mirror targets when modal opens
  useEffect(() => {
    if (!isOpen || !organizationId) return
    let isMounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted && data.user?.id) {
        setFundedByUserId((prev) => prev ?? data.user!.id)
      }
    })

    getOrganizationCategoriesByType(organizationId)
      .then((res) => {
        if (!isMounted) return
        const incomeNames = res.income.map((c) => c.display_name || c.normalized_name)
        const expenseNames = res.expense.map((c) => c.display_name || c.normalized_name)
        setOrgCategories({
          income: incomeNames.length > 0 ? incomeNames : DEFAULT_INCOME_CATEGORIES,
          expense: expenseNames.length > 0 ? expenseNames : DEFAULT_EXPENSE_CATEGORIES,
        })
      })
      .catch(() => {})

    if (!isWallet) {
      getUserMirrorableWalletAccounts(organizationId)
        .then((ctx) => {
          if (!isMounted) return
          setMirrorContext(ctx)
          if (ctx) {
            try {
              const stored = localStorage.getItem(`org_mirror_wallet_${organizationId}`)
              if (stored && ctx.accounts.some((acc) => acc.id === stored)) {
                setMirrorWalletAccountId(stored)
              }
            } catch {
              // Ignore storage access errors
            }
          }
        })
        .catch(() => {})
    }

    return () => {
      isMounted = false
    }
  }, [isOpen, organizationId, isWallet])

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 30000)
    return () => clearTimeout(timer)
  }, [error])

  // Reset form when modal opens or closes
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!isOpen) {
      setMirrorWalletAccountId('')
      setMirrorContext(null)
      return
    }
    setDisplayExpr('0')
    setNotes('')
    setError(null)
    setShowTypeDropdown(false)
    setShowCategoryDropdown(false)
    setShowMirrorDropdown(false)
    setShowRefundConfirm(false)
    setCustomCategoryInput('')
    setFundedByType('business')
    setExpenseType(isWallet ? 'personal' : 'business')
    const tab = isWallet && initialTab === 'refund' ? 'expense' : initialTab
    setActiveTab(tab)
    if (tab === 'income') {
      setCategory(orgCategories.income[0] || 'Salary')
    } else if (tab === 'expense') {
      setCategory(orgCategories.expense[0] || 'Food & Dining')
    }
    setTxDate(formatLocalDateInput(new Date().toISOString()))
    setTxTime(new Date().toTimeString().split(' ')[0].substring(0, 5))
  }, [isOpen, initialTab, isWallet])
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const currentCategoriesList = useMemo(() => {
    return activeTab === 'income' ? orgCategories.income : orgCategories.expense
  }, [activeTab, orgCategories])

  const canMirror = Boolean(
    !isWallet &&
      mirrorContext &&
      mirrorContext.accounts.length > 0 &&
      ((activeTab === 'income' && fundedByType === 'business') ||
        (activeTab === 'expense' && expenseType === 'business'))
  )

  const selectedMirrorAccount = useMemo(
    () => mirrorContext?.accounts.find((acc) => acc.id === mirrorWalletAccountId) ?? null,
    [mirrorContext, mirrorWalletAccountId]
  )

  const selectMirrorAccount = (nextAccountId: string) => {
    setMirrorWalletAccountId(nextAccountId)
    setShowMirrorDropdown(false)
    try {
      if (nextAccountId) {
        localStorage.setItem(`org_mirror_wallet_${organizationId}`, nextAccountId)
      } else {
        localStorage.removeItem(`org_mirror_wallet_${organizationId}`)
      }
    } catch {
      // Ignore storage access errors
    }
  }

  const switchTab = (nextTab: OrgTransactionTab) => {
    setActiveTab(nextTab)
    setError(null)
    setShowTypeDropdown(false)
    setShowCategoryDropdown(false)
    setShowMirrorDropdown(false)
    if (nextTab === 'income' && !orgCategories.income.includes(category)) {
      setCategory(orgCategories.income[0] || 'Salary')
    } else if (nextTab === 'expense' && !orgCategories.expense.includes(category)) {
      setCategory(orgCategories.expense[0] || 'Food & Dining')
    }
  }

  const evaluatedAmount = useMemo(() => evaluateMathExpression(displayExpr), [displayExpr])
  const isAmountValid = evaluatedAmount !== 0

  const handleKeypadPress = useCallback(
    (key: string) => {
      setError(null)
      if (key === '=') {
        const val = evaluateMathExpression(displayExpr)
        if (val === 0) {
          setError('Calculated amount cannot be 0.')
          setDisplayExpr('0')
        } else {
          setDisplayExpr(String(val))
        }
        return
      }

      if (key === 'BACKSPACE') {
        setDisplayExpr(displayExpr.length <= 1 ? '0' : displayExpr.slice(0, -1))
        return
      }

      if (displayExpr === '0' && '0123456789'.includes(key)) {
        setDisplayExpr(key)
      } else {
        const lastChar = displayExpr.slice(-1)
        const isOp = '+-×÷.'.includes(key)
        const lastIsOp = '+-×÷.'.includes(lastChar)
        setDisplayExpr(
          isOp && lastIsOp ? displayExpr.slice(0, -1) + key : displayExpr + key
        )
      }
    },
    [displayExpr]
  )

  const executeRefund = useCallback(async () => {
    setShowRefundConfirm(false)
    setIsSubmitting(true)
    setError(null)

    const result = await createRefund({
      organizationId,
      amount: Math.abs(evaluatedAmount),
      description: notes.trim() || undefined,
    })

    setIsSubmitting(false)

    if (result && 'error' in result) {
      setError(result.error ?? 'Unable to record refund')
      return
    }

    onTransactionAdded?.()
    router.refresh()
    onClose()
  }, [
    organizationId,
    evaluatedAmount,
    notes,
    onTransactionAdded,
    router,
    onClose,
  ])

  const handleSave = useCallback(async () => {
    setError(null)
    if (!isAmountValid) {
      setError('Transaction amount cannot be 0.')
      return
    }

    const amount = Math.abs(evaluatedAmount)

    if (activeTab === 'refund') {
      setShowRefundConfirm(true)
      return
    }

    setIsSubmitting(true)
    const now = new Date()
    const sec = String(now.getSeconds()).padStart(2, '0')
    const ms = String(now.getMilliseconds()).padStart(3, '0')
    const fullDate = new Date(`${txDate}T${txTime}:${sec}.${ms}`).toISOString()

    const mirrorAccount =
      canMirror && mirrorWalletAccountId ? mirrorWalletAccountId : undefined

    const result =
      activeTab === 'income'
        ? await addIncome({
            organizationId,
            amount,
            category: category.trim() || undefined,
            description: notes.trim() || undefined,
            occurredAt: fullDate,
            fundedByType,
            fundedByUserId: fundedByUserId || undefined,
            mirrorWalletAccountId: mirrorAccount,
          })
        : await addExpense({
            organizationId,
            amount,
            category: category.trim() || undefined,
            description: notes.trim() || undefined,
            occurredAt: fullDate,
            expenseType: isWallet ? 'personal' : expenseType,
            mirrorWalletAccountId: mirrorAccount,
          })

    setIsSubmitting(false)

    if (result && 'error' in result) {
      setError(result.error ?? 'Unable to save transaction')
      return
    }

    onTransactionAdded?.()
    router.refresh()
    onClose()
  }, [
    isAmountValid,
    evaluatedAmount,
    activeTab,
    txDate,
    txTime,
    organizationId,
    category,
    notes,
    fundedByType,
    fundedByUserId,
    isWallet,
    expenseType,
    canMirror,
    mirrorWalletAccountId,
    onTransactionAdded,
    router,
    onClose,
  ])

  // Keyboard support (Escape, Tab trap, calculator keys, Enter)
  useEffect(() => {
    if (!isOpen || showRefundConfirm || manageCategoriesOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
          )
        ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0)

        if (focusable.length === 0) {
          e.preventDefault()
          return
        }

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault()
            last.focus()
          }
        } else if (
          document.activeElement === last ||
          !modalRef.current.contains(document.activeElement)
        ) {
          e.preventDefault()
          first.focus()
        }
        return
      }

      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        const isEvaluated = !/[+\-×÷]/.test(displayExpr)
        if (isEvaluated && isAmountValid && !isSubmitting) {
          handleSave()
        } else {
          handleKeypadPress('=')
        }
        return
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        handleKeypadPress('BACKSPACE')
        return
      }

      const keyMap: Record<string, string> = {
        '*': '×',
        x: '×',
        X: '×',
        '/': '÷',
        '+': '+',
        '-': '-',
        '.': '.',
      }

      if (keyMap[e.key]) {
        e.preventDefault()
        handleKeypadPress(keyMap[e.key])
        return
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleKeypadPress(e.key)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    isOpen,
    showRefundConfirm,
    manageCategoriesOpen,
    displayExpr,
    isAmountValid,
    isSubmitting,
    handleSave,
    handleKeypadPress,
    onClose,
  ])

  if (!isOpen) return null

  const accentText =
    activeTab === 'income'
      ? 'text-emerald-500'
      : activeTab === 'expense'
      ? 'text-rose-500'
      : 'text-amber-500'

  const accentBadgeBg =
    activeTab === 'income'
      ? 'bg-emerald-500 text-emerald-950'
      : activeTab === 'expense'
      ? 'bg-rose-500 text-rose-950'
      : 'bg-amber-500 text-amber-950'

  const accentButtonBg =
    activeTab === 'income'
      ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
      : activeTab === 'expense'
      ? 'bg-rose-500 text-rose-950 hover:bg-rose-400'
      : 'bg-amber-500 text-amber-950 hover:bg-amber-400'

  const accentDropdownActive =
    activeTab === 'income'
      ? 'bg-emerald-500/15 text-emerald-500'
      : activeTab === 'expense'
      ? 'bg-rose-500/15 text-rose-500'
      : 'bg-amber-500/15 text-amber-500'

  const formatDisplayDate = (dStr: string) => {
    try {
      const d = new Date(`${dStr}T00:00:00`)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dStr
    }
  }

  const formatDisplayTime = (tStr: string) => {
    try {
      const [h, m] = tStr.split(':')
      let hours = parseInt(h, 10)
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12 || 12
      return `${hours}:${m} ${ampm}`
    } catch {
      return tStr
    }
  }

  return (
    <>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Add Organization Transaction"
        tabIndex={-1}
        className="fixed inset-0 z-50 flex flex-col bg-background/80 backdrop-blur-md text-foreground animate-in fade-in-0 duration-200 overflow-y-auto outline-none"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
            <span>CANCEL</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isAmountValid || isSubmitting}
            className={`flex items-center gap-1.5 text-xs font-semibold tracking-wider transition-colors ${accentText} hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Check className="h-4 w-4" />
            <span>{isSubmitting ? 'SAVING...' : 'SAVE'}</span>
          </button>
        </div>

        <div className="flex-1 max-w-lg w-full mx-auto flex flex-col justify-between p-6 space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-destructive/80 hover:text-destructive font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Segmented Control (INCOME | EXPENSE | REFUND) */}
          <div className="flex items-center justify-center space-x-6 text-sm font-medium tracking-wide">
            <button
              type="button"
              onClick={() => switchTab('income')}
              className={`flex items-center gap-1.5 pb-1 transition-colors ${
                activeTab === 'income'
                  ? `${accentText} font-bold`
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === 'income' && (
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${accentBadgeBg}`}>
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              )}
              <span>INCOME</span>
            </button>

            <span className="text-border">|</span>

            <button
              type="button"
              onClick={() => switchTab('expense')}
              className={`flex items-center gap-1.5 pb-1 transition-colors ${
                activeTab === 'expense'
                  ? `${accentText} font-bold`
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === 'expense' && (
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${accentBadgeBg}`}>
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              )}
              <span>EXPENSE</span>
            </button>

            {!isWallet && (
              <>
                <span className="text-border">|</span>
                <button
                  type="button"
                  onClick={() => switchTab('refund')}
                  className={`flex items-center gap-1.5 pb-1 transition-colors ${
                    activeTab === 'refund'
                      ? `${accentText} font-bold`
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {activeTab === 'refund' && (
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${accentBadgeBg}`}>
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                  <span>REFUND</span>
                </button>
              </>
            )}
          </div>

          {/* Two-Selector Row (mirrors Wallet Account | Category grid) */}
          {activeTab === 'refund' ? (
            <div className="rounded-xl border border-border bg-card/80 px-4 py-3 flex items-center justify-center gap-2.5 text-sm font-medium text-muted-foreground shadow-sm">
              <RefreshCw className={`h-4 w-4 shrink-0 ${accentText}`} />
              <span>Deducts from your outstanding personal contributions</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 relative">
              {/* LEFT SELECTOR: Funded By (Income) or Expense Type (Expense) */}
              <div className="relative">
                <span className="block text-[11px] font-medium text-muted-foreground text-center mb-1">
                  {activeTab === 'income' ? 'Funded By' : 'Expense Type'}
                </span>
                <button
                  type="button"
                  disabled={activeTab === 'expense' && isWallet}
                  onClick={() => {
                    setShowCategoryDropdown(false)
                    setShowMirrorDropdown(false)
                    setShowTypeDropdown((v) => !v)
                  }}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-card/80 hover:bg-muted text-foreground font-semibold text-sm transition-all shadow-sm disabled:opacity-70"
                >
                  {activeTab === 'income' ? (
                    fundedByType === 'business' ? (
                      <Building2 className={`h-4 w-4 ${accentText}`} />
                    ) : (
                      <User className={`h-4 w-4 ${accentText}`} />
                    )
                  ) : expenseType === 'business' ? (
                    <Briefcase className={`h-4 w-4 ${accentText}`} />
                  ) : (
                    <User className={`h-4 w-4 ${accentText}`} />
                  )}
                  <span className="truncate">
                    {activeTab === 'income'
                      ? fundedByType === 'business'
                        ? 'Organization'
                        : 'Personal'
                      : expenseType === 'business'
                      ? 'Business'
                      : 'Personal'}
                  </span>
                </button>

                {showTypeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-border bg-card p-1.5 shadow-2xl">
                    {(['business', 'personal'] as const).map((opt) => {
                      const isSelected =
                        activeTab === 'income'
                          ? fundedByType === opt
                          : expenseType === opt
                      const label =
                        activeTab === 'income'
                          ? opt === 'business'
                            ? 'Organization'
                            : 'Personal'
                          : opt === 'business'
                          ? 'Business'
                          : 'Personal'

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (activeTab === 'income') setFundedByType(opt)
                            else setExpenseType(opt)
                            setShowTypeDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            isSelected
                              ? `${accentDropdownActive} font-semibold`
                              : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT SELECTOR: Category */}
              <div className="relative">
                <span className="block text-[11px] font-medium text-muted-foreground text-center mb-1">
                  Category
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowTypeDropdown(false)
                    setShowMirrorDropdown(false)
                    setShowCategoryDropdown((v) => !v)
                  }}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-card/80 hover:bg-muted text-foreground font-semibold text-sm transition-all shadow-sm"
                >
                  <Tag className={`h-4 w-4 ${accentText}`} />
                  <span className="truncate">{category || 'Category'}</span>
                </button>

                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-border bg-card p-2 shadow-2xl max-h-60 overflow-y-auto space-y-1">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-border mb-1">
                      <input
                        type="text"
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="New category..."
                        className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customCategoryInput.trim()) {
                            setCategory(customCategoryInput.trim())
                            setCustomCategoryInput('')
                            setShowCategoryDropdown(false)
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors ${accentButtonBg}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {currentCategoriesList.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat)
                          setShowCategoryDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          cat === category
                            ? `${accentDropdownActive} font-semibold`
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}

                    <div className="pt-1 mt-1 border-t border-border">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryDropdown(false)
                          setManageCategoriesOpen(true)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        <span>Manage &amp; unify categories</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Optional Auto-Mirror to Personal Wallet Sub-Account */}
          {canMirror && mirrorContext && (
            <div className="relative">
              <div className="flex items-center justify-between mb-1 px-0.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Mirror to {mirrorContext.walletOrgName} (Optional)
                </span>
                {selectedMirrorAccount && (
                  <button
                    type="button"
                    onClick={() => selectMirrorAccount('')}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowTypeDropdown(false)
                  setShowCategoryDropdown(false)
                  setShowMirrorDropdown((v) => !v)
                }}
                className="w-full flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-card/80 hover:bg-muted text-foreground text-sm transition-all shadow-sm"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Wallet className={`h-4 w-4 shrink-0 ${selectedMirrorAccount ? accentText : 'text-muted-foreground'}`} />
                  <span className={`truncate ${selectedMirrorAccount ? 'font-semibold' : 'text-muted-foreground'}`}>
                    {selectedMirrorAccount
                      ? `${selectedMirrorAccount.name} (${
                          activeTab === 'income' ? '+' : '−'
                        } via ${mirrorContext.linkedAccountName})`
                      : "Don't mirror (Org only)"}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>

              {showMirrorDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-border bg-card p-1.5 shadow-2xl max-h-56 overflow-y-auto space-y-0.5">
                  <button
                    type="button"
                    onClick={() => selectMirrorAccount('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !mirrorWalletAccountId
                        ? `${accentDropdownActive} font-semibold`
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    Don&apos;t mirror (Org only)
                  </button>
                  {mirrorContext.accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => selectMirrorAccount(acc.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        mirrorWalletAccountId === acc.id
                          ? `${accentDropdownActive} font-semibold`
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="truncate">{acc.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        {formatCurrency(acc.current_balance, currency)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes Textarea */}
          <div className="rounded-xl border border-border bg-card/70 p-3 shadow-sm">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes"
              rows={3}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none resize-none"
            />
          </div>

          {/* Large Amount Display Area */}
          <div className="space-y-1">
            <div className="rounded-2xl border border-border bg-card/70 px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="flex-1 overflow-x-auto text-right pr-4">
                <span className={`text-4xl font-light tracking-tight ${accentText}`}>
                  {displayExpr}
                </span>
                {displayExpr.match(/[+\-×÷]/) && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    = {formatCurrency(evaluatedAmount, currency)}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleKeypadPress('BACKSPACE')}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Backspace"
              >
                <Delete className="h-6 w-6" />
              </button>
            </div>

            {evaluatedAmount === 0 && displayExpr !== '0' && (
              <div className="flex items-center gap-1.5 text-xs text-destructive px-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Amount cannot be 0</span>
              </div>
            )}
            {evaluatedAmount < 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-500 px-2 mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Negative result will be recorded as a positive value</span>
              </div>
            )}
          </div>

          {/* 4x4 Interactive Calculator Keypad */}
          <div className="grid grid-cols-4 gap-2.5">
            {[
              ['+', '7', '8', '9'],
              ['-', '4', '5', '6'],
              ['×', '1', '2', '3'],
              ['÷', '0', '.', '='],
            ].map((row) =>
              row.map((key) => {
                const isOp = ['+', '-', '×', '÷'].includes(key)
                const isEq = key === '='
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className={
                      isEq
                        ? `h-14 rounded-xl font-bold text-xl transition-colors shadow-sm ${accentButtonBg}`
                        : isOp
                        ? 'h-14 rounded-xl bg-secondary/80 text-secondary-foreground font-medium text-xl hover:bg-secondary transition-colors border border-border/50 shadow-sm'
                        : 'h-14 rounded-xl bg-card/80 text-foreground font-medium text-xl hover:bg-muted transition-colors border border-border/50 shadow-sm'
                    }
                  >
                    {key}
                  </button>
                )
              })
            )}
          </div>

          {/* Date & Time Footer */}
          {activeTab !== 'refund' ? (
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs font-medium text-muted-foreground">
              <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                <Calendar className={`h-4 w-4 ${accentText}`} />
                <span>{formatDisplayDate(txDate)}</span>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="sr-only"
                />
              </label>

              <span className="text-border">|</span>

              <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                <Clock className={`h-4 w-4 ${accentText}`} />
                <span>{formatDisplayTime(txTime)}</span>
                <input
                  type="time"
                  value={txTime}
                  onChange={(e) => setTxTime(e.target.value)}
                  className="sr-only"
                />
              </label>
            </div>
          ) : (
            <div className="pt-2 border-t border-border text-center text-xs font-medium text-muted-foreground">
              Refunds are recorded with the current timestamp
            </div>
          )}
        </div>
      </div>

      <ManageCategoriesDialog
        open={manageCategoriesOpen}
        onOpenChange={setManageCategoriesOpen}
        organizationId={organizationId}
        onCategoriesChanged={refreshCategories}
      />

      <Dialog open={showRefundConfirm} onOpenChange={setShowRefundConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Refund</DialogTitle>
            <DialogDescription>
              Are you sure you want to record a refund of{' '}
              <span className="font-semibold text-foreground">
                {formatCurrency(Math.abs(evaluatedAmount), currency)}
              </span>
              ? This will deduct from your outstanding personal contributions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRefundConfirm(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={executeRefund}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Recording...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
