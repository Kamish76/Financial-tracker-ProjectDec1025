'use client'

import React, { useState, useMemo } from 'react'
import { WalletAccount, AccountWithBalance } from '@/lib/wallet-accounts'
import { addWalletTransaction } from '@/lib/wallet-transactions'
import { 
  X, 
  Check, 
  Wallet, 
  Tag, 
  Delete, 
  Calendar, 
  Clock, 
  ArrowRightLeft,
  Plus,
  AlertCircle 
} from 'lucide-react'

type AddTransactionModalProps = {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  accounts: (WalletAccount | AccountWithBalance)[]
  onTransactionAdded?: () => void
}

function getDisplayBalance(acc: WalletAccount | AccountWithBalance): string {
  const val =
    'current_balance' in acc && typeof (acc as AccountWithBalance).current_balance === 'number'
      ? (acc as AccountWithBalance).current_balance
      : acc.starting_value

  return `$${Number(val).toLocaleString('en-US', {
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

type TabType = 'income' | 'expense' | 'transfer'

const DEFAULT_CATEGORIES = [
  'Salary',
  'Food & Dining',
  'Utilities',
  'Shopping',
  'Transportation',
  'Entertainment',
  'Health & Fitness',
  'Housing',
  'Investments',
  'Other',
]

// Safely evaluates arithmetic expressions without eval()
function evaluateMathExpression(expr: string): number {
  try {
    // Replace visual symbols with standard JS operators
    const clean = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/[^0-9+\-*/.]/g, '')

    if (!clean || /^[^0-9(]/.test(clean)) return 0

    // Tokenize and evaluate simple BODMAS/operator order
    const tokens: (number | string)[] = []
    let curNum = ''
    for (const char of clean) {
      if ('+-*/'.includes(char)) {
        if (curNum !== '') {
          tokens.push(parseFloat(curNum))
          curNum = ''
        }
        tokens.push(char)
      } else {
        curNum += char
      }
    }
    if (curNum !== '') {
      tokens.push(parseFloat(curNum))
    }

    if (tokens.length === 0) return 0
    if (tokens.length === 1 && typeof tokens[0] === 'number') return tokens[0]

    // First pass: multiplication and division
    const pass1: (number | string)[] = []
    let i = 0
    while (i < tokens.length) {
      const token = tokens[i]
      if (token === '*' || token === '/') {
        const prev = pass1.pop() as number
        const next = (tokens[i + 1] ?? 1) as number
        if (token === '*') {
          pass1.push(prev * next)
        } else {
          pass1.push(next === 0 ? 0 : prev / next)
        }
        i += 2
      } else {
        pass1.push(token)
        i++
      }
    }

    // Second pass: addition and subtraction
    let result = (pass1[0] as number) || 0
    i = 1
    while (i < pass1.length) {
      const op = pass1[i]
      const val = (pass1[i + 1] ?? 0) as number
      if (op === '+') result += val
      else if (op === '-') result -= val
      i += 2
    }

    return isNaN(result) ? 0 : Number(result.toFixed(2))
  } catch {
    return 0
  }
}

export function AddTransactionModal({
  isOpen,
  onClose,
  organizationId,
  accounts,
  onTransactionAdded,
}: AddTransactionModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('income')
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id ?? ''
  )
  const [transferToAccountId, setTransferToAccountId] = useState<string>(
    accounts.length > 1 ? accounts[1].id : ''
  )
  const [category, setCategory] = useState<string>('Salary')
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false)
  const [showAccountDropdown, setShowAccountDropdown] = useState<'from' | 'to' | null>(null)
  const [notes, setNotes] = useState<string>('')
  const [displayExpr, setDisplayExpr] = useState<string>('0')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Date/time state
  const [txDate, setTxDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [txTime, setTxTime] = useState<string>(
    new Date().toTimeString().split(' ')[0].substring(0, 5)
  )

  // Compute evaluated amount on the fly
  const evaluatedAmount = useMemo(() => {
    return evaluateMathExpression(displayExpr)
  }, [displayExpr])

  // Non-negative safeguard rule: check if evaluated amount > 0
  const isAmountValid = evaluatedAmount > 0

  if (!isOpen) return null

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)
  const selectedToAccount = accounts.find((a) => a.id === transferToAccountId)

  // Color coding by transaction type: Income = Green, Expense = Red, Transfer = Yellow
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

  const handleKeypadPress = (key: string) => {
    setError(null)
    if (key === '=') {
      const val = evaluateMathExpression(displayExpr)
      if (val <= 0) {
        setError('Calculated amount must be greater than 0.')
        setDisplayExpr('0')
      } else {
        setDisplayExpr(String(val))
      }
      return
    }

    if (key === 'BACKSPACE') {
      if (displayExpr.length <= 1) {
        setDisplayExpr('0')
      } else {
        setDisplayExpr(displayExpr.slice(0, -1))
      }
      return
    }

    if (displayExpr === '0' && '0123456789'.includes(key)) {
      setDisplayExpr(key)
    } else {
      // Prevent consecutive operators
      const lastChar = displayExpr.slice(-1)
      const isOp = '+-×÷.'.includes(key)
      const lastIsOp = '+-×÷.'.includes(lastChar)
      if (isOp && lastIsOp) {
        setDisplayExpr(displayExpr.slice(0, -1) + key)
      } else {
        setDisplayExpr(displayExpr + key)
      }
    }
  }

  const handleSave = async () => {
    setError(null)
    if (!isAmountValid) {
      setError('Transaction amount must be greater than 0.')
      return
    }

    if (!selectedAccountId) {
      setError('Please select an account.')
      return
    }

    if (activeTab === 'transfer' && !transferToAccountId) {
      setError('Please select a destination account.')
      return
    }

    if (activeTab === 'transfer' && selectedAccountId === transferToAccountId) {
      setError('Source and destination accounts must be different.')
      return
    }

    setIsSubmitting(true)

    // Build ISO timestamp from date and time
    const fullDate = new Date(`${txDate}T${txTime}:00`).toISOString()

    const typeParam =
      activeTab === 'income'
        ? 'income'
        : activeTab === 'expense'
        ? 'expense_personal'
        : 'transfer'

    const res = await addWalletTransaction({
      organizationId,
      type: typeParam,
      amount: evaluatedAmount,
      accountId: selectedAccountId,
      transferToAccountId: activeTab === 'transfer' ? transferToAccountId : null,
      category: activeTab === 'transfer' ? 'Transfer' : category,
      notes: notes.trim(),
      createdAt: fullDate,
    })

    setIsSubmitting(false)

    if (res.error) {
      setError(res.error)
    } else {
      onTransactionAdded?.()
      onClose()
      // reset form
      setDisplayExpr('0')
      setNotes('')
      setError(null)
    }
  }

  const formatDisplayDate = (dStr: string) => {
    try {
      const d = new Date(dStr + 'T00:00:00')
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
      hours = hours % 12
      hours = hours ? hours : 12
      return `${hours}:${m} ${ampm}`
    } catch {
      return tStr
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/80 backdrop-blur-md text-foreground animate-in fade-in-0 duration-200 overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
          <span>CANCEL</span>
        </button>

        <button
          onClick={handleSave}
          disabled={!isAmountValid || isSubmitting}
          className={`flex items-center gap-1.5 text-xs font-semibold tracking-wider transition-colors ${accentText} hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Check className="h-4 w-4" />
          <span>{isSubmitting ? 'SAVING...' : 'SAVE'}</span>
        </button>
      </div>

      <div className="flex-1 max-w-lg w-full mx-auto flex flex-col justify-between p-6 space-y-6">
        {/* Error / Alert banner */}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-destructive/80 hover:text-destructive font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Segmented Control (INCOME = Green | EXPENSE = Red | TRANSFER = Yellow) */}
        <div className="flex items-center justify-center space-x-6 text-sm font-medium tracking-wide">
          <button
            onClick={() => {
              setActiveTab('income')
              setError(null)
            }}
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
            onClick={() => {
              setActiveTab('expense')
              setError(null)
            }}
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

          <span className="text-border">|</span>

          <button
            onClick={() => {
              setActiveTab('transfer')
              setError(null)
            }}
            className={`flex items-center gap-1.5 pb-1 transition-colors ${
              activeTab === 'transfer'
                ? `${accentText} font-bold`
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {activeTab === 'transfer' && (
              <span className={`flex h-5 w-5 items-center justify-center rounded-full ${accentBadgeBg}`}>
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
            )}
            <span>TRANSFER</span>
          </button>
        </div>

        {/* Row of two Selector Buttons (Account & Category OR From & To) */}
        <div className="grid grid-cols-2 gap-3 relative">
          {/* LEFT SELECTOR: Account (or From Account) */}
          <div className="relative">
            <span className="block text-[11px] font-medium text-muted-foreground text-center mb-1">
              {activeTab === 'transfer' ? 'From' : 'Account'}
            </span>
            <button
              onClick={() =>
                setShowAccountDropdown(
                  showAccountDropdown === 'from' ? null : 'from'
                )
              }
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-card/80 hover:bg-accent text-foreground font-semibold text-sm transition-all shadow-sm"
            >
              <Wallet className={`h-4 w-4 ${accentText}`} />
              <span className="truncate">
                {selectedAccount?.name || 'Select Account'}
              </span>
            </button>

            {/* Account dropdown */}
            {showAccountDropdown === 'from' && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-border bg-card p-1.5 shadow-2xl max-h-48 overflow-y-auto">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setSelectedAccountId(acc.id)
                      setShowAccountDropdown(null)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                      acc.id === selectedAccountId
                        ? `${accentDropdownActive} font-semibold`
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <span>{acc.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {getDisplayBalance(acc)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SELECTOR: Category OR To Account */}
          <div className="relative">
            <span className="block text-[11px] font-medium text-muted-foreground text-center mb-1">
              {activeTab === 'transfer' ? 'To' : 'Category'}
            </span>

            {activeTab === 'transfer' ? (
              // TO ACCOUNT SELECTOR
              <>
                <button
                  onClick={() =>
                    setShowAccountDropdown(
                      showAccountDropdown === 'to' ? null : 'to'
                    )
                  }
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-card/80 hover:bg-accent text-foreground font-semibold text-sm transition-all shadow-sm"
                >
                  <ArrowRightLeft className={`h-4 w-4 ${accentText}`} />
                  <span className="truncate">
                    {selectedToAccount?.name || 'Select To'}
                  </span>
                </button>

                {showAccountDropdown === 'to' && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-border bg-card p-1.5 shadow-2xl max-h-48 overflow-y-auto">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        disabled={acc.id === selectedAccountId}
                        onClick={() => {
                          setTransferToAccountId(acc.id)
                          setShowAccountDropdown(null)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                          acc.id === selectedAccountId
                            ? 'opacity-40 cursor-not-allowed text-muted-foreground'
                            : acc.id === transferToAccountId
                            ? `${accentDropdownActive} font-semibold`
                            : 'text-foreground hover:bg-accent'
                        }`}
                      >
                        <span>{acc.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {getDisplayBalance(acc)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // CATEGORY SELECTOR
              <>
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-card/80 hover:bg-accent text-foreground font-semibold text-sm transition-all shadow-sm"
                >
                  <Tag className={`h-4 w-4 ${accentText}`} />
                  <span className="truncate">{category || 'Category'}</span>
                </button>

                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-border bg-card p-2 shadow-2xl max-h-60 overflow-y-auto space-y-1">
                    {/* Custom category creation row */}
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

                    {DEFAULT_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setCategory(cat)
                          setShowCategoryDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          cat === category
                            ? `${accentDropdownActive} font-semibold`
                            : 'text-foreground hover:bg-accent'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

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

        {/* Large Amount Display Area with non-negative warning */}
        <div className="space-y-1">
          <div className="rounded-2xl border border-border bg-card/70 px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex-1 overflow-x-auto text-right pr-4">
              <span className={`text-4xl font-light tracking-tight ${accentText}`}>
                {displayExpr}
              </span>
              {/* Show evaluated value preview if displayExpr is an expression */}
              {displayExpr.match(/[+\-×÷]/) && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  = ${evaluatedAmount.toFixed(2)}
                </div>
              )}
            </div>

            <button
              onClick={() => handleKeypadPress('BACKSPACE')}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Backspace"
            >
              <Delete className="h-6 w-6" />
            </button>
          </div>

          {!isAmountValid && displayExpr !== '0' && (
            <div className="flex items-center gap-1.5 text-xs text-destructive px-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Amount must be greater than 0</span>
            </div>
          )}
        </div>

        {/* 4x4 Interactive Calculator Keypad */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Row 1 */}
          <button
            onClick={() => handleKeypadPress('+')}
            className="h-14 rounded-xl bg-secondary/80 text-secondary-foreground font-medium text-xl hover:bg-secondary transition-colors border border-border/50 shadow-sm"
          >
            +
          </button>
          <button
            onClick={() => handleKeypadPress('7')}
            className="h-14 rounded-xl bg-card/80 text-foreground font-medium text-xl hover:bg-accent transition-colors border border-border/50 shadow-sm"
          >
            7
          </button>
          <button
            onClick={() => handleKeypadPress('8')}
            className="h-14 rounded-xl bg-card/80 text-foreground font-medium text-xl hover:bg-accent transition-colors border border-border/50 shadow-sm"
          >
            8
          </button>
          <button
            onClick={() => handleKeypadPress('9')}
            className="h-14 rounded-xl bg-card/80 text-foreground font-medium text-xl hover:bg-accent transition-colors border border-border/50 shadow-sm"
          >
            9
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleKeypadPress('-')}
            className="h-14 rounded-xl bg-secondary/80 text-secondary-foreground font-medium text-xl hover:bg-secondary transition-colors border border-border/50 shadow-sm"
          >
            -
          </button>
          <button
            onClick={() => handleKeypadPress('4')}
            className="h-14 rounded-xl bg-card/80 text-foreground font-medium text-xl hover:bg-accent transition-colors border border-border/50 shadow-sm"
          >
            4
          </button>
          <button
            onClick={() => handleKeypadPress('5')}
            className="h-14 rounded-xl bg-card/80 text-foreground font-medium text-xl hover:bg-accent transition-colors border border-border/50 shadow-sm"
          >
            5
          </button>
          <button
            onClick={() => handleKeypadPress('6')}
            className="h-14 rounded-xl bg-card/80 text-foreground font-medium text-xl hover:bg-accent transition-colors border border-border/50 shadow-sm"
          >
            6
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleKeypadPress('×')}
            className="h-14 rounded-xl bg-secondary/80 text-secondary-foreground font-medium text-xl hover:bg-secondary transition-colors border border-border/50 shadow-sm"
          >
            ×
          </button>
          <button
            onClick={() => handleKeypadPress('1')}
            className="h-14 rounded-xl bg-card/80 text-foreground font-medium text-xl hover:bg-accent transition-colors border border-border/50 shadow-sm"
          >
            1
          </button>
          <button
            onClick={() => handleKeypadPress('2')}
            className="h-14 rounded-xl bg-card/80 text-foreground font-medium text-xl hover:bg-accent transition-colors border border-border/50 shadow-sm"
          >
            2
          </button>
          <button
            onClick={() => handleKeypadPress('3')}
            className="h-14 rounded-xl bg-card/80 text-foreground font-medium text-xl hover:bg-accent transition-colors border border-border/50 shadow-sm"
          >
            3
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleKeypadPress('÷')}
            className="h-14 rounded-xl bg-secondary/80 text-secondary-foreground font-medium text-xl hover:bg-secondary transition-colors border border-border/50 shadow-sm"
          >
            ÷
          </button>
          <button
            onClick={() => handleKeypadPress('0')}
            className="h-14 rounded-xl bg-card/80 text-foreground font-medium text-xl hover:bg-accent transition-colors border border-border/50 shadow-sm"
          >
            0
          </button>
          <button
            onClick={() => handleKeypadPress('.')}
            className="h-14 rounded-xl bg-card/80 text-foreground font-medium text-xl hover:bg-accent transition-colors border border-border/50 shadow-sm"
          >
            .
          </button>
          <button
            onClick={() => handleKeypadPress('=')}
            className={`h-14 rounded-xl font-bold text-xl transition-colors shadow-sm ${accentButtonBg}`}
          >
            =
          </button>
        </div>

        {/* Date & Time Footer Buttons */}
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
      </div>
    </div>
  )
}
