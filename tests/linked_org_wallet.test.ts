import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import * as guards from '@/lib/auth/guards'
import * as supabaseServer from '@/lib/supabase/server'
import * as categories from '@/lib/categories'
import { getAccountsWithBalances, updateWalletAccount } from '@/lib/wallet-accounts'
import { addWalletTransaction } from '@/lib/wallet-transactions'
import { createTransaction, updateTransaction } from '@/app/(authenticated)/organizations/[id]/records/actions'
import { fetchOrganizationMembers } from '@/app/(authenticated)/organizations/[id]/records/utils'
import { setMemberBaseline, addIncomeForMember, addExpenseForMember } from '@/app/(authenticated)/organizations/[id]/actions'
import { GET as healthCheckGet } from '@/app/api/health-check/route'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Linked Organization Withholding Sub-Account', () => {
  const walletOrgId = 'wallet-org-1'
  const bizOrgId = 'biz-org-1'
  const userId = 'user-owner-1'

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(guards, 'requireUser').mockResolvedValue({ id: userId } as User)
    vi.spyOn(guards, 'requireOrgMembership').mockResolvedValue({
      user: { id: userId } as User,
      membership: { organizationId: walletOrgId, userId, role: 'owner', isActive: true },
    })
    vi.spyOn(guards, 'authorizeOrgAction').mockResolvedValue({
      ok: true,
      user: { id: userId } as User,
      membership: { organizationId: walletOrgId, userId, role: 'owner', isActive: true },
    })
  })

  it('uses trigger-maintained linked_org_balance while preserving unlinked transfer deltas', async () => {
    const accountsRows = [
      {
        id: 'acc-maya',
        organization_id: walletOrgId,
        name: 'Maya',
        starting_value: 12708.74,
        is_active: true,
        linked_org_id: null,
        linked_org_balance: null,
        created_at: '2026-07-29T00:00:00Z',
        updated_at: '2026-07-29T00:00:00Z',
      },
      {
        id: 'acc-linked',
        organization_id: walletOrgId,
        name: 'Biz Withholding',
        starting_value: -27025,
        is_active: true,
        linked_org_id: bizOrgId,
        linked_org_balance: -24013.99,
        created_at: '2026-07-29T00:00:00Z',
        updated_at: '2026-07-29T00:00:00Z',
      },
    ]

    const walletTxRows = [
      {
        id: 'tx-w-1',
        account_id: 'acc-maya',
        transfer_to_account_id: 'acc-linked',
        type: 'transfer',
        amount: 2486.01,
      },
    ]

    vi.spyOn(supabaseServer, 'createAdminClient').mockImplementation(() => {
      return {
        from: (table: string) => {
          const builder: Record<string, unknown> = {
            select: () => builder,
            eq: () => builder,
            in: () => builder,
            or: () => builder,
            order: () => builder,
            limit: () => builder,
            then: (resolve: (v: unknown) => unknown) => {
              if (table === 'wallet_accounts') return resolve({ data: accountsRows, error: null })
              if (table === 'organizations') return resolve({ data: [{ id: bizOrgId, name: 'KYUBI' }], error: null })
              if (table === 'transactions') return resolve({ data: walletTxRows, error: null })
              return resolve({ data: [], error: null })
            },
          }
          return builder
        },
      } as unknown as ReturnType<typeof supabaseServer.createAdminClient>
    })

    const result = await getAccountsWithBalances(walletOrgId, false)
    const maya = result.find((a) => a.id === 'acc-maya')
    const linked = result.find((a) => a.id === 'acc-linked')

    expect(maya?.current_balance).toBeCloseTo(10222.73, 2)
    expect(linked?.current_balance).toBeCloseTo(-24013.99, 2)
    expect(linked?.starting_value).toBe(-27025)
    expect(linked?.linked_org_name).toBe('KYUBI')
  })

  it('blocks direct income/expense on linked accounts in addWalletTransaction and createTransaction, but allows editing notes on existing linked txs', async () => {
    vi.spyOn(supabaseServer, 'createAdminClient').mockImplementation(() => {
      const filters: Record<string, unknown> = {}
      const makeBuilder = (table: string) => {
        const builder: Record<string, unknown> = {
          select: () => builder,
          insert: () => builder,
          update: () => builder,
          eq: (col: string, val: unknown) => {
            filters[col] = val
            return builder
          },
          maybeSingle: async () => {
            if (table === 'organizations') return { data: { id: walletOrgId }, error: null }
            if (table === 'transactions') {
              return {
                data: {
                  id: 'tx-existing',
                  organization_id: walletOrgId,
                  is_initial: false,
                  type: 'expense_personal',
                  account_id: 'acc-linked',
                },
                error: null,
              }
            }
            if (table === 'wallet_accounts') {
              if (filters.id === 'acc-linked') {
                return { data: { id: 'acc-linked', organization_id: walletOrgId, is_active: true, linked_org_id: bizOrgId }, error: null }
              }
              return { data: { id: 'acc-maya', organization_id: walletOrgId, is_active: true, linked_org_id: null }, error: null }
            }
            return { data: null, error: null }
          },
          single: async () => ({ data: { id: 'new-tx-1' }, error: null }),
        }
        return builder
      }
      return { from: makeBuilder } as unknown as ReturnType<typeof supabaseServer.createAdminClient>
    })

    const blockedAdd = await addWalletTransaction({
      organizationId: walletOrgId,
      type: 'expense_personal',
      amount: 100,
      accountId: 'acc-linked',
    })
    expect(blockedAdd.error).toContain('read-only')

    const blockedCreate = await createTransaction({
      organizationId: walletOrgId,
      type: 'income',
      amount: 100,
      accountId: 'acc-linked',
    })
    expect(blockedCreate.error).toContain('read-only')

    // Editing notes on an existing transaction belonging to a linked account succeeds when accountId is unchanged
    const allowedEditSameAccount = await updateTransaction({
      organizationId: walletOrgId,
      transactionId: 'tx-existing',
      accountId: 'acc-linked',
      description: 'Updated note',
    })
    expect(allowedEditSameAccount).toMatchObject({ success: true })

    const allowedTransfer = await addWalletTransaction({
      organizationId: walletOrgId,
      type: 'transfer',
      amount: 100,
      accountId: 'acc-maya',
      transferToAccountId: 'acc-linked',
    })
    expect(allowedTransfer.success).toBe(true)
  })

  it('preserves starting_value when linking and clears linked fields when unlinking', async () => {
    const capturedUpdates: Record<string, unknown>[] = []

    vi.spyOn(supabaseServer, 'createAdminClient').mockImplementation(() => {
      const makeBuilder = (table: string) => {
        const builder: Record<string, unknown> = {
          select: () => builder,
          update: (payload: Record<string, unknown>) => {
            capturedUpdates.push(payload)
            return builder
          },
          eq: () => builder,
          maybeSingle: async () => {
            if (table === 'wallet_accounts') {
              return { data: { organization_id: walletOrgId, linked_org_id: null }, error: null }
            }
            if (table === 'organizations') {
              return { data: { id: bizOrgId, owner_id: userId }, error: null }
            }
            return { data: null, error: null }
          },
          then: (resolve: (v: unknown) => unknown) => resolve({ data: null, error: null }),
        }
        return builder
      }
      return { from: makeBuilder } as unknown as ReturnType<typeof supabaseServer.createAdminClient>
    })

    const linkRes = await updateWalletAccount('acc-1', 'My Account', -27025, bizOrgId)
    expect(linkRes.success).toBe(true)
    expect(capturedUpdates[0]).toMatchObject({
      name: 'My Account',
      linked_org_id: bizOrgId,
    })
    expect(capturedUpdates[0]).not.toHaveProperty('starting_value')

    const unlinkRes = await updateWalletAccount('acc-1', 'My Account', -27025, null)
    expect(unlinkRes.success).toBe(true)
    expect(capturedUpdates[1]).toMatchObject({
      name: 'My Account',
      starting_value: -27025,
      linked_org_id: null,
      linked_org_balance: null,
    })
  })
})

describe('Audit hardening & reliability fixes', () => {
  const orgId = 'org-audit-1'
  const userId = 'user-owner-1'

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(guards, 'authorizeOrgAction').mockResolvedValue({
      ok: true,
      user: { id: userId } as User,
      membership: { organizationId: orgId, userId, role: 'owner', isActive: true },
    })
    vi.spyOn(categories, 'getOrCreateCategory').mockResolvedValue('cat-1')
  })

  it('health-check returns 500 when SUPABASE_SERVICE_ROLE_KEY is missing instead of falling back to anon key', async () => {
    const prevCron = process.env.CRON_SECRET
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const prevService = process.env.SUPABASE_SERVICE_ROLE_KEY
    const prevAnon = process.env.SUPABASE_ANON_KEY

    try {
      process.env.CRON_SECRET = 'secret-123'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      process.env.SUPABASE_ANON_KEY = 'anon-key-should-not-be-used'

      const req = new NextRequest('http://localhost/api/health-check', {
        headers: { authorization: 'Bearer secret-123' },
      })
      const res = await healthCheckGet(req)
      const body = await res.json()

      expect(res.status).toBe(500)
      expect(body.success).toBe(false)
      expect(body.error).toContain('service role')
    } finally {
      if (prevCron === undefined) delete process.env.CRON_SECRET
      else process.env.CRON_SECRET = prevCron
      if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
      else process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl
      if (prevService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
      else process.env.SUPABASE_SERVICE_ROLE_KEY = prevService
      if (prevAnon === undefined) delete process.env.SUPABASE_ANON_KEY
      else process.env.SUPABASE_ANON_KEY = prevAnon
    }
  })

  it('fetchOrganizationMembers does not scan transactions and still includes deactivated members', async () => {
    const queriedTables: string[] = []
    vi.spyOn(supabaseServer, 'createAdminClient').mockImplementation(() => {
      return {
        from: (table: string) => {
          queriedTables.push(table)
          const builder: Record<string, unknown> = {
            select: () => builder,
            eq: () => builder,
            in: () => builder,
            maybeSingle: async () =>
              table === 'organizations' ? { data: { owner_id: 'owner-1' }, error: null } : { data: null, error: null },
            then: (resolve: (v: unknown) => unknown) => {
              if (table === 'organization_members') {
                return resolve({
                  data: [
                    { user_id: 'owner-1', role: 'owner', is_active: true },
                    { user_id: 'former-1', role: 'member', is_active: false },
                  ],
                  error: null,
                })
              }
              if (table === 'profiles') {
                return resolve({
                  data: [
                    { id: 'owner-1', full_name: 'Owner User', avatar_url: null },
                    { id: 'former-1', full_name: 'Former Member', avatar_url: null },
                  ],
                  error: null,
                })
              }
              return resolve({ data: [], error: null })
            },
          }
          return builder
        },
        rpc: async () => ({ data: [], error: null }),
      } as unknown as ReturnType<typeof supabaseServer.createAdminClient>
    })

    const members = await fetchOrganizationMembers(orgId)
    expect(queriedTables).not.toContain('transactions')
    expect(members.map((m) => m.id)).toEqual(['owner-1', 'former-1'])
  })

  it('setMemberBaseline scans allocations once and uses get_organization_financial_totals RPC for cashOnHand', async () => {
    let allocationSelectCount = 0
    const insertedPayloads: Record<string, unknown>[] = []
    const rpcCalls: string[] = []

    vi.spyOn(supabaseServer, 'createAdminClient').mockImplementation(() => {
      const makeBuilder = (table: string) => {
        const builder: Record<string, unknown> = {
          select: () => {
            if (table === 'transactions') allocationSelectCount++
            return builder
          },
          insert: async (payload: Record<string, unknown>) => {
            insertedPayloads.push(payload)
            return { error: null }
          },
          eq: () => builder,
          in: () => builder,
          limit: () => builder,
          maybeSingle: async () =>
            table === 'organization_members'
              ? { data: { organization_id: orgId, user_id: 'member-1', is_active: true }, error: null }
              : { data: null, error: null },
          then: (resolve: (v: unknown) => unknown) => {
            if (table === 'transactions') {
              return resolve({
                data: [
                  { type: 'held_allocate', amount: 200, category: 'Allocation', funded_by_user_id: 'member-1' },
                ],
                error: null,
              })
            }
            return resolve({ data: [], error: null })
          },
        }
        return builder
      }
      return {
        from: makeBuilder,
        rpc: async (fn: string) => {
          rpcCalls.push(fn)
          return {
            data: [{ total_income: 2000, total_expenses_business: 500, total_refund_withdrawals: 0 }],
            error: null,
          }
        },
      } as unknown as ReturnType<typeof supabaseServer.createAdminClient>
    })

    const res = await setMemberBaseline({ organizationId: orgId, userId: 'member-1', targetBaseline: 600 })
    expect(res).toEqual({ success: true })
    expect(allocationSelectCount).toBe(1)
    expect(rpcCalls).toContain('get_organization_financial_totals')
    expect(insertedPayloads[0]).toMatchObject({
      type: 'held_allocate',
      amount: 400,
      funded_by_user_id: 'member-1',
    })
  })

  it('addIncomeForMember and addExpenseForMember validate active assignee and insert expected payloads', async () => {
    const insertedPayloads: Record<string, unknown>[] = []
    let memberExists = false

    vi.spyOn(supabaseServer, 'createAdminClient').mockImplementation(() => {
      const makeBuilder = () => {
        const builder: Record<string, unknown> = {
          select: () => builder,
          insert: async (payload: Record<string, unknown>) => {
            insertedPayloads.push(payload)
            return { error: null }
          },
          eq: () => builder,
          maybeSingle: async () => ({
            data: memberExists ? { organization_id: orgId, user_id: 'member-1', is_active: true } : null,
            error: null,
          }),
        }
        return builder
      }
      return { from: makeBuilder } as unknown as ReturnType<typeof supabaseServer.createAdminClient>
    })

    const invalidRes = await addIncomeForMember({
      organizationId: orgId,
      amount: 100,
      occurredAt: '2026-11-18',
      assignedToUserId: 'non-member',
    })
    expect(invalidRes).toEqual({ error: 'Selected member is not part of this organization' })

    memberExists = true
    const incRes = await addIncomeForMember({
      organizationId: orgId,
      amount: 250,
      category: 'Sales',
      occurredAt: '2026-11-18',
      assignedToUserId: 'member-1',
    })
    const expRes = await addExpenseForMember({
      organizationId: orgId,
      amount: 75,
      expenseType: 'personal',
      occurredAt: '2026-11-18',
      assignedToUserId: 'member-1',
    })

    expect(incRes).toEqual({ success: true })
    expect(expRes).toEqual({ success: true })
    expect(insertedPayloads[0]).toMatchObject({ type: 'income', funded_by_type: 'business', funded_by_user_id: 'member-1', is_initial: false })
    expect(insertedPayloads[1]).toMatchObject({ type: 'expense_personal', funded_by_type: 'personal', funded_by_user_id: 'member-1', is_initial: false })
  })
})
