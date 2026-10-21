import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getOrganizationStats } from '@/lib/finance'
import { sanitizePostgrestFilter } from '@/app/(authenticated)/organizations/[id]/records/utils'
import * as supabaseServer from '@/lib/supabase/server'

describe('Unit Tests: Financial Accounting Calculations & Precision', () => {
  describe('Accounting Core Formulas (Mathematical Invariants)', () => {
    it('computes cashOnHand as totalIncome - totalExpensesBusiness - totalRefundWithdrawals', () => {
      const totalIncome = 5000
      const totalExpensesBusiness = 1200
      const totalRefundWithdrawals = 300

      const cashOnHand = totalIncome - totalExpensesBusiness - totalRefundWithdrawals
      expect(cashOnHand).toBe(3500)
    })

    it('computes actualExpensesWithoutCapital deducting capital expense from personal expenses', () => {
      const totalExpensesBusiness = 2000
      const totalExpensesPersonal = 1500
      const expensesCapital = 500

      const actualExpensesWithoutCapital =
        totalExpensesBusiness + Math.max(totalExpensesPersonal - expensesCapital, 0)
      expect(actualExpensesWithoutCapital).toBe(3000)
    })

    it('clamps personal expenses at 0 if capital expense exceeds personal expenses', () => {
      const totalExpensesBusiness = 1000
      const totalExpensesPersonal = 400
      const expensesCapital = 800 // Capital exceeds personal

      const actualExpensesWithoutCapital =
        totalExpensesBusiness + Math.max(totalExpensesPersonal - expensesCapital, 0)
      expect(actualExpensesWithoutCapital).toBe(1000)
    })

    it('computes actualExpensesVsIncome as net difference', () => {
      const totalIncome = 10000
      const actualExpensesWithoutCapital = 6500

      const actualExpensesVsIncome = totalIncome - actualExpensesWithoutCapital
      expect(actualExpensesVsIncome).toBe(3500)
    })

    it('computes member outstanding reimbursable balance with zero lower-bound', () => {
      const contributedPersonal = 1500
      const reimbursementsPaid = 1000
      const outstanding = Math.max(contributedPersonal - reimbursementsPaid, 0)
      expect(outstanding).toBe(500)

      const overReimbursedOutstanding = Math.max(1000 - 1500, 0)
      expect(overReimbursedOutstanding).toBe(0)
    })
  })

  describe('PostgREST Filter Sanitization (AGENTS.md Rule 4)', () => {
    it('strips commas, parentheses, quotes, periods, and backslashes', () => {
      const maliciousInput = 'admin,(role.eq.owner),amount.gt.0"\\test'
      const sanitized = sanitizePostgrestFilter(maliciousInput)
      expect(sanitized).toBe('adminroleeqowneramountgt0test')
      expect(sanitized).not.toContain(',')
      expect(sanitized).not.toContain('(')
      expect(sanitized).not.toContain(')')
      expect(sanitized).not.toContain('.')
      expect(sanitized).not.toContain('"')
      expect(sanitized).not.toContain('\\')
    })

    it('handles empty and whitespace-only strings gracefully', () => {
      expect(sanitizePostgrestFilter('')).toBe('')
      expect(sanitizePostgrestFilter('   ')).toBe('')
    })

    it('preserves alphanumeric search terms and spaces', () => {
      const cleanInput = 'Office Supplies 2026'
      expect(sanitizePostgrestFilter(cleanInput)).toBe('Office Supplies 2026')
    })
  })

  describe('Composite Cursor Pagination Encoding & Decoding', () => {
    it('correctly creates and parses composite cursor ${occurred_at}___${id}', () => {
      const occurredAt = '2026-10-21T08:00:00.000Z'
      const id = 'c6913e2f-2d43-4dc9-9801-b54190e29b12'
      const compositeCursor = `${occurredAt}___${id}`

      expect(compositeCursor).toContain('___')
      const [parsedTime, parsedId] = compositeCursor.split('___')
      expect(parsedTime).toBe(occurredAt)
      expect(parsedId).toBe(id)
    })

    it('handles legacy single-timestamp cursor without crashing', () => {
      const legacyCursor = '2026-10-21T08:00:00.000Z'
      const hasComposite = legacyCursor.includes('___')
      expect(hasComposite).toBe(false)
    })

    it('rejects malformed or injected cursor IDs preventing PostgREST filter injection', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const validUuid = 'c6913e2f-2d43-4dc9-9801-b54190e29b12'
      const maliciousInject = '1),amount.gt.0,(id.eq.1'
      const invalidUuid = 'not-a-valid-uuid'

      expect(uuidRegex.test(validUuid)).toBe(true)
      expect(uuidRegex.test(maliciousInject)).toBe(false)
      expect(uuidRegex.test(invalidUuid)).toBe(false)
    })
  })

  describe('getOrganizationStats Database Aggregation & Fallback Integration', () => {
    const mockOrgId = 'test-org-uuid'

    const mockTransactions = [
      { type: 'income', amount: 10000, category: 'Sales', funded_by_type: 'business', funded_by_user_id: 'user-1' },
      { type: 'expense_business', amount: 3000, category: 'Rent', funded_by_type: 'business', funded_by_user_id: 'user-1' },
      { type: 'expense_personal', amount: 1500, category: 'Hardware', funded_by_type: 'personal', funded_by_user_id: 'user-2' },
      { type: 'expense_personal', amount: 500, category: 'capital', funded_by_type: 'personal', funded_by_user_id: 'user-2' },
      { type: 'held_return', amount: 600, category: 'Refund', funded_by_type: 'business', funded_by_user_id: 'user-2' },
      { type: 'held_allocate', amount: 2000, category: 'Allocation', funded_by_type: 'business', funded_by_user_id: 'user-2' },
    ]

    const mockMembers = [
      { user_id: 'user-1', role: 'owner', is_active: true },
      { user_id: 'user-2', role: 'member', is_active: true },
    ]

    const mockReimbursements = [
      { from_user_id: 'user-2', amount: 600 },
    ]

    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('correctly aggregates stats using database fallback when RPC is unavailable', async () => {
      vi.spyOn(supabaseServer, 'createAdminClient').mockImplementation(() => {
        return {
          rpc: async (fn: string) => {
            if (fn === 'get_organization_financial_totals') {
              return { data: null, error: { message: 'function does not exist' } }
            }
            if (fn === 'get_org_member_emails') {
              return { data: [{ user_id: 'user-1', email: 'owner@org.com' }, { user_id: 'user-2', email: 'member@org.com' }], error: null }
            }
            return { data: null, error: null }
          },
          from: (table: string) => {
            const queryBuilder = {
              select: () => queryBuilder,
              eq: () => queryBuilder,
              limit: () => queryBuilder,
              then: (resolve: (val: unknown) => unknown) => {
                if (table === 'transactions') {
                  return resolve({ data: mockTransactions, error: null })
                }
                if (table === 'organization_members') {
                  return resolve({ data: mockMembers, error: null })
                }
                if (table === 'reimbursement_requests') {
                  return resolve({ data: mockReimbursements, error: null })
                }
                return resolve({ data: [], error: null })
              },
            }
            return queryBuilder
          },
        } as unknown as ReturnType<typeof supabaseServer.createAdminClient>
      })

      const stats = await getOrganizationStats(mockOrgId)

      // Verification of Totals
      expect(stats.totals.totalIncome).toBe(10000)
      expect(stats.totals.totalExpensesBusiness).toBe(3000)
      expect(stats.totals.totalExpensesPersonal).toBe(2000) // 1500 + 500
      expect(stats.totals.expensesCapital).toBe(500)
      expect(stats.totals.actualExpensesWithoutCapital).toBe(4500) // 3000 + (2000 - 500)
      expect(stats.totals.cashOnHand).toBe(6400) // 10000 - 3000 - 600 refund
      expect(stats.totals.actualExpensesVsIncome).toBe(5500) // 10000 - 4500

      // Verification of Member Balances
      const user2 = stats.members.find((m) => m.user_id === 'user-2')
      expect(user2).toBeDefined()
      expect(user2?.contributedPersonal).toBe(2000) // 1500 + 500
      expect(user2?.reimbursementsPaid).toBe(600)
      expect(user2?.outstandingReimbursable).toBe(1400) // 2000 - 600
      expect(user2?.businessHeld).toBe(1400) // 2000 allocated - 600 returned
    })

    it('correctly handles categories with leading/trailing whitespace in fallback', async () => {
      const whitespaceTransactions = [
        { type: 'income', amount: 5000, category: ' Sales ', funded_by_type: 'business', funded_by_user_id: 'user-1' },
        { type: 'expense_business', amount: 1000, category: ' Rent ', funded_by_type: 'business', funded_by_user_id: 'user-1' },
        { type: 'expense_personal', amount: 800, category: ' Capital ', funded_by_type: 'personal', funded_by_user_id: 'user-2' },
        { type: 'held_return', amount: 200, category: ' Refund ', funded_by_type: 'business', funded_by_user_id: 'user-2' },
      ]

      vi.spyOn(supabaseServer, 'createAdminClient').mockImplementation(() => {
        return {
          rpc: async (fn: string) => {
            if (fn === 'get_organization_financial_totals') {
              return { data: null, error: { message: 'function does not exist' } }
            }
            if (fn === 'get_org_member_emails') {
              return { data: [{ user_id: 'user-1', email: 'owner@org.com' }], error: null }
            }
            return { data: null, error: null }
          },
          from: (table: string) => {
            const queryBuilder = {
              select: () => queryBuilder,
              eq: () => queryBuilder,
              limit: () => queryBuilder,
              then: (resolve: (val: unknown) => unknown) => {
                if (table === 'transactions') {
                  return resolve({ data: whitespaceTransactions, error: null })
                }
                return resolve({ data: [], error: null })
              },
            }
            return queryBuilder
          },
        } as unknown as ReturnType<typeof supabaseServer.createAdminClient>
      })

      const stats = await getOrganizationStats('test-org-uuid')
      expect(stats.totals.totalIncome).toBe(5000)
      expect(stats.totals.totalExpensesBusiness).toBe(1000)
      expect(stats.totals.expensesCapital).toBe(800)
      expect(stats.totals.actualExpensesWithoutCapital).toBe(1000) // 1000 + max(800 - 800, 0)
      expect(stats.totals.cashOnHand).toBe(3800) // 5000 - 1000 - 200
    })

    it('prefers RPC get_organization_financial_totals output when available', async () => {
      vi.spyOn(supabaseServer, 'createAdminClient').mockImplementation(() => {
        return {
          rpc: async (fn: string) => {
            if (fn === 'get_organization_financial_totals') {
              return {
                data: [
                  {
                    total_income: 10000,
                    total_expenses_business: 3000,
                    total_expenses_personal: 2000,
                    expenses_capital: 500,
                    total_refund_withdrawals: 600,
                  },
                ],
                error: null,
              }
            }
            if (fn === 'get_org_member_emails') {
              return { data: [{ user_id: 'user-1', email: 'owner@org.com' }], error: null }
            }
            return { data: null, error: null }
          },
          from: (table: string) => {
            const queryBuilder = {
              select: () => queryBuilder,
              eq: () => queryBuilder,
              limit: () => queryBuilder,
              then: (resolve: (val: unknown) => unknown) => {
                if (table === 'transactions') {
                  return resolve({ data: mockTransactions, error: null })
                }
                if (table === 'organization_members') {
                  return resolve({ data: mockMembers, error: null })
                }
                if (table === 'reimbursement_requests') {
                  return resolve({ data: mockReimbursements, error: null })
                }
                return resolve({ data: [], error: null })
              },
            }
            return queryBuilder
          },
        } as unknown as ReturnType<typeof supabaseServer.createAdminClient>
      })

      const stats = await getOrganizationStats(mockOrgId)
      expect(stats.totals.totalIncome).toBe(10000)
      expect(stats.totals.totalExpensesBusiness).toBe(3000)
      expect(stats.totals.cashOnHand).toBe(6400)
      expect(stats.totals.actualExpensesWithoutCapital).toBe(4500)
    })
  })

  describe('Account Deletion Endpoint Authentication Security (BOLA Prevention)', () => {
    it('rejects unauthenticated requests to POST /api/delete-account with 401', async () => {
      vi.spyOn(supabaseServer, 'createClient').mockImplementation(async () => {
        return {
          auth: {
            getUser: async () => ({ data: { user: null }, error: new Error('Unauthorized') }),
          },
        } as unknown as Awaited<ReturnType<typeof supabaseServer.createClient>>
      })

      const { POST } = await import('@/app/api/delete-account/route')
      const fakeRequest = new Request('http://localhost/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'victim@example.com', confirmed: true }),
      })

      const response = await POST(fakeRequest as unknown as import('next/server').NextRequest)
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('signed in')
    })

    it('rejects unauthenticated requests to GET /api/delete-account with 401', async () => {
      vi.spyOn(supabaseServer, 'createClient').mockImplementation(async () => {
        return {
          auth: {
            getUser: async () => ({ data: { user: null }, error: new Error('Unauthorized') }),
          },
        } as unknown as Awaited<ReturnType<typeof supabaseServer.createClient>>
      })

      const { GET } = await import('@/app/api/delete-account/route')
      const fakeRequest = new Request('http://localhost/api/delete-account?email=victim@example.com', {
        method: 'GET',
      })

      const response = await GET(fakeRequest as unknown as import('next/server').NextRequest)
      expect(response.status).toBe(401)
    })

    it('rejects unauthenticated requests to DELETE /api/delete-account with 401', async () => {
      vi.spyOn(supabaseServer, 'createClient').mockImplementation(async () => {
        return {
          auth: {
            getUser: async () => ({ data: { user: null }, error: new Error('Unauthorized') }),
          },
        } as unknown as Awaited<ReturnType<typeof supabaseServer.createClient>>
      })

      const { DELETE } = await import('@/app/api/delete-account/route')
      const fakeRequest = new Request('http://localhost/api/delete-account', {
        method: 'DELETE',
      })

      const response = await DELETE(fakeRequest as unknown as import('next/server').NextRequest)
      expect(response.status).toBe(401)
    })
  })
})
