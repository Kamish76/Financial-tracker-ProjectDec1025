import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatCurrency } from '@/lib/utils'
import { verifyOrgAccess } from '@/lib/wallet-accounts'
import { requireOrgMembership } from '@/lib/auth/guards'
import * as supabaseServer from '@/lib/supabase/server'
import * as serverContext from '@/lib/auth/server-context'
import type { User } from '@supabase/supabase-js'

describe('Unit Tests: Guards, Utils & Production Resilience', () => {
  describe('formatCurrency utility', () => {
    it('formats USD currency correctly', () => {
      const result = formatCurrency(1234.56, 'USD')
      expect(result).toBe('$1,234.56')
    })

    it('formats PHP currency correctly', () => {
      const result = formatCurrency(2500, 'PHP')
      expect(result).toContain('2,500.00')
      expect(result.includes('PHP') || result.includes('₱')).toBe(true)
    })

    it('formats EUR currency correctly', () => {
      const result = formatCurrency(50.25, 'EUR')
      expect(result).toContain('50.25')
      expect(result.includes('€') || result.includes('EUR')).toBe(true)
    })

    it('handles zero amount gracefully', () => {
      const result = formatCurrency(0, 'USD')
      expect(result).toBe('$0.00')
    })

    it('handles null and undefined amounts with fallback to zero', () => {
      expect(formatCurrency(null, 'USD')).toBe('$0.00')
      expect(formatCurrency(undefined, 'USD')).toBe('$0.00')
    })

    it('handles invalid currency codes with fallback to USD', () => {
      const result = formatCurrency(100, 'INVALID_CODE')
      expect(result).toBe('$100.00')
    })
  })

  describe('verifyOrgAccess utility', () => {
    const mockDb = {
      organizations: [
        { id: 'org-1', owner_id: 'user-owner' },
      ],
      organization_members: [
        { organization_id: 'org-1', user_id: 'user-active', is_active: true },
        { organization_id: 'org-1', user_id: 'user-inactive', is_active: false },
      ],
    }

    beforeEach(() => {
      vi.spyOn(supabaseServer, 'createAdminClient').mockImplementation(() => {
        return {
          from: (table: string) => {
            const filters: Record<string, string | boolean> = {}
            const queryBuilder = {
              select: () => queryBuilder,
              eq: (column: string, value: string | boolean) => {
                filters[column] = value
                return queryBuilder
              },
              maybeSingle: async () => {
                if (table === 'organizations') {
                  const match = mockDb.organizations.find(
                    (o) =>
                      (!filters.id || o.id === filters.id) &&
                      (!filters.owner_id || o.owner_id === filters.owner_id)
                  )
                  return { data: match || null, error: null }
                }
                if (table === 'organization_members') {
                  const match = mockDb.organization_members.find(
                    (m) =>
                      (!filters.organization_id || m.organization_id === filters.organization_id) &&
                      (!filters.user_id || m.user_id === filters.user_id) &&
                      (filters.is_active === undefined || m.is_active === filters.is_active)
                  )
                  return { data: match || null, error: null }
                }
                return { data: null, error: null }
              },
            }
            return queryBuilder
          },
        } as unknown as ReturnType<typeof supabaseServer.createAdminClient>
      })
    })

    it('returns true when user is the organization owner', async () => {
      const hasAccess = await verifyOrgAccess('org-1', 'user-owner')
      expect(hasAccess).toBe(true)
    })

    it('returns true when user is an active organization member', async () => {
      const hasAccess = await verifyOrgAccess('org-1', 'user-active')
      expect(hasAccess).toBe(true)
    })

    it('returns false when user is an inactive organization member', async () => {
      const hasAccess = await verifyOrgAccess('org-1', 'user-inactive')
      expect(hasAccess).toBe(false)
    })

    it('returns false when user is not a member of the organization', async () => {
      const hasAccess = await verifyOrgAccess('org-1', 'user-stranger')
      expect(hasAccess).toBe(false)
    })
  })

  describe('requireOrgMembership guard', () => {
    it('returns user and membership when user is an authorized member', async () => {
      const mockUser: User = {
        id: 'user-member',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }
      const mockMembership: serverContext.OrgMembership = {
        organizationId: 'org-1',
        userId: 'user-member',
        role: 'member',
        isActive: true,
      }

      vi.spyOn(serverContext, 'getAuthContext').mockResolvedValue({
        user: mockUser,
        userId: mockUser.id,
        isAuthenticated: true,
        getOrgMembership: async (orgId: string) => {
          if (orgId === 'org-1') return mockMembership
          return null
        },
        hasOrgRole: async () => true,
      })

      const result = await requireOrgMembership('org-1')
      expect(result.user).toEqual(mockUser)
      expect(result.membership).toEqual(mockMembership)
    })

    it('redirects to /auth when user is not signed in', async () => {
      vi.spyOn(serverContext, 'getAuthContext').mockResolvedValue({
        user: null,
        userId: null,
        isAuthenticated: false,
        getOrgMembership: async () => null,
        hasOrgRole: async () => false,
      })

      let caughtError: (Error & { digest?: string }) | undefined
      try {
        await requireOrgMembership('org-1')
      } catch (err) {
        caughtError = err as Error & { digest?: string }
      }

      expect(caughtError).toBeDefined()
      expect(caughtError?.message || caughtError?.digest).toContain('NEXT_REDIRECT')
      expect(caughtError?.digest).toContain('/auth')
    })

    it('redirects to /organizations when membership is not found or inactive', async () => {
      const mockUser: User = {
        id: 'user-stranger',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }

      vi.spyOn(serverContext, 'getAuthContext').mockResolvedValue({
        user: mockUser,
        userId: mockUser.id,
        isAuthenticated: true,
        getOrgMembership: async () => null,
        hasOrgRole: async () => false,
      })

      let caughtError: (Error & { digest?: string }) | undefined
      try {
        await requireOrgMembership('org-1')
      } catch (err) {
        caughtError = err as Error & { digest?: string }
      }

      expect(caughtError).toBeDefined()
      expect(caughtError?.message || caughtError?.digest).toContain('NEXT_REDIRECT')
      expect(caughtError?.digest).toContain('/organizations')
    })
  })
})
