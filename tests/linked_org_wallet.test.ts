import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import * as guards from '@/lib/auth/guards'
import * as supabaseServer from '@/lib/supabase/server'
import { getAccountsWithBalances, updateWalletAccount } from '@/lib/wallet-accounts'
import { addWalletTransaction } from '@/lib/wallet-transactions'
import { createTransaction, updateTransaction } from '@/app/(authenticated)/organizations/[id]/records/actions'

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
