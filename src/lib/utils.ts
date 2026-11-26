import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined, currencyCode: string = 'USD'): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0
  const safeCurrency = (currencyCode && currencyCode.trim()) ? currencyCode.trim().toUpperCase() : 'USD'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
    }).format(safeAmount)
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(safeAmount)
  }
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatLocalDateInput(isoString?: string | null): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function mergeDateWithOriginalTime(dateStr: string, originalIso?: string | null): string {
  if (!dateStr) return originalIso || ''
  if (originalIso && formatLocalDateInput(originalIso) === dateStr) {
    return originalIso
  }
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return originalIso || dateStr

  const orig = originalIso ? new Date(originalIso) : null
  const hasValidOrig = orig && !Number.isNaN(orig.getTime())
  const merged = new Date(
    y,
    m - 1,
    d,
    hasValidOrig ? orig.getHours() : 12,
    hasValidOrig ? orig.getMinutes() : 0,
    hasValidOrig ? orig.getSeconds() : 0,
    hasValidOrig ? orig.getMilliseconds() : 0
  )
  return merged.toISOString()
}

/** Safely evaluates arithmetic expressions (+, -, ×/*, ÷//) with leading/unary negatives without eval(). */
export function evaluateMathExpression(expr: string): number {
  try {
    let clean = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/[^0-9+\-*/.]/g, '')

    if (clean.startsWith('-')) {
      clean = '0' + clean
    }

    if (!clean || /^[^0-9(]/.test(clean)) return 0

    const tokens: (number | string)[] = []
    let curNum = ''
    for (let j = 0; j < clean.length; j++) {
      const char = clean[j]
      if (
        char === '-' &&
        (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string') &&
        curNum === ''
      ) {
        curNum = '-'
        continue
      }
      if ('+-*/'.includes(char)) {
        if (curNum !== '' && curNum !== '-') {
          tokens.push(parseFloat(curNum))
          curNum = ''
        }
        tokens.push(char)
      } else {
        curNum += char
      }
    }
    if (curNum !== '' && curNum !== '-') {
      tokens.push(parseFloat(curNum))
    }

    if (tokens.length === 0) return 0
    if (tokens.length === 1 && typeof tokens[0] === 'number') {
      return !Number.isFinite(tokens[0]) || tokens[0] === 0 ? 0 : Number(tokens[0].toFixed(2))
    }

    const pass1: (number | string)[] = []
    let i = 0
    while (i < tokens.length) {
      const token = tokens[i]
      if (token === '*' || token === '/') {
        const prev = pass1.pop()
        const next = tokens[i + 1]
        if (typeof prev !== 'number') return 0
        if (next === undefined) {
          pass1.push(prev)
          break
        }
        if (typeof next !== 'number') return 0
        pass1.push(token === '*' ? prev * next : next === 0 ? 0 : prev / next)
        i += 2
      } else {
        pass1.push(token)
        i++
      }
    }

    if (typeof pass1[0] !== 'number') return 0
    let result = pass1[0]
    i = 1
    while (i < pass1.length) {
      const op = pass1[i]
      const val = pass1[i + 1]
      if (val === undefined) break
      if (typeof val !== 'number') return 0
      if (op === '+') result += val
      else if (op === '-') result -= val
      else return 0
      i += 2
    }

    return !Number.isFinite(result) || result === 0 ? 0 : Number(result.toFixed(2))
  } catch {
    return 0
  }
}

/** Normalizes a transaction amount to a positive 2-decimal number, or null if zero/invalid. */
export function normalizeTransactionAmount(value: unknown): number | null {
  const num = typeof value === 'string' && value.trim() === '' ? NaN : Number(value)
  if (!Number.isFinite(num)) return null
  const rounded = Number(Math.abs(num).toFixed(2))
  return rounded > 0 ? rounded : null
}
