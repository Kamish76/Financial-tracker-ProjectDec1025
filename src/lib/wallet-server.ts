import { createAdminClient } from '@/lib/supabase/server'
import { isWalletOrganization } from '@/lib/wallet'

export async function getUserWalletId(userId: string): Promise<string | null> {
  try {
    const adminClient = createAdminClient()

    const { data: memberships, error } = await adminClient
      .from('organization_members')
      .select(`
        organization_id,
        organizations (
          id,
          description
        )
      `)
      .eq('user_id', userId)

    if (!error && memberships) {
      for (const m of memberships) {
        const orgData = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations
        if (orgData && isWalletOrganization((orgData as { description: string | null }).description)) {
          return (orgData as { id: string }).id
        }
      }
    }

    const { data: ownedWallets, error: ownerError } = await adminClient
      .from('organizations')
      .select('id, description')
      .eq('owner_id', userId)

    if (!ownerError && ownedWallets) {
      for (const org of ownedWallets) {
        if (isWalletOrganization(org.description)) {
          return org.id
        }
      }
    }

    return null
  } catch (error) {
    console.error('[GET_USER_WALLET_ID] Error checking wallet organization:', error)
    return null
  }
}
