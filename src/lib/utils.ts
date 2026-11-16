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

/** Safely evaluates arithmetic expressions (+, -, ×/ *, ÷//) without eval(). */
export function evaluateMathExpression(expr: string): number {
  try {
    const clean = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/[^0-9+\-*/.]/g, '')

    if (!clean || /^[^0-9(]/.test(clean)) return 0

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

    const pass1: (number | string)[] = []
    let i = 0
    while (i < tokens.length) {
      const token = tokens[i]
      if (token === '*' || token === '/') {
        const prev = pass1.pop() as number
        const next = (tokens[i + 1] ?? 1) as number
        pass1.push(token === '*' ? prev * next : next === 0 ? 0 : prev / next)
        i += 2
      } else {
        pass1.push(token)
        i++
      }
    }

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
