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
