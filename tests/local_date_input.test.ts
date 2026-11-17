import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatLocalDateInput } from '@/lib/utils'

describe('formatLocalDateInput', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses local date getters rather than UTC or string slicing', () => {
    const utcDateSpy = vi.spyOn(Date.prototype, 'getUTCDate')
    const localDateSpy = vi.spyOn(Date.prototype, 'getDate').mockReturnValue(17)
    const localMonthSpy = vi.spyOn(Date.prototype, 'getMonth').mockReturnValue(10) // November (0-indexed)
    const localYearSpy = vi.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2026)

    expect(formatLocalDateInput('2026-11-16T23:30:00.000Z')).toBe('2026-11-17')
    expect(utcDateSpy).not.toHaveBeenCalled()
    expect(localDateSpy).toHaveBeenCalledTimes(1)
    expect(localMonthSpy).toHaveBeenCalledTimes(1)
    expect(localYearSpy).toHaveBeenCalledTimes(1)
  })

  it('returns empty string for missing or invalid dates', () => {
    expect(formatLocalDateInput(null)).toBe('')
    expect(formatLocalDateInput(undefined)).toBe('')
    expect(formatLocalDateInput('not-a-date')).toBe('')
  })
})
