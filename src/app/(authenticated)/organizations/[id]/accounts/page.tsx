import { requireOrgMembership } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/server'
import { getAccountsWithBalances } from '@/lib/wallet-accounts'
import { AccountsClient } from './accounts-client'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AccountsPage({ params }: Props) {
  const { id } = await params
  await requireOrgMembership(id)

  const adminClient = createAdminClient()
  const [accounts, { data: organization }] = await Promise.all([
    getAccountsWithBalances(id, true),
    adminClient
      .from('organizations')
      .select('currency')
      .eq('id', id)
      .maybeSingle(),
  ])

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <AccountsClient
        organizationId={id}
        accounts={accounts}
        currency={organization?.currency}
      />
    </div>
  )
}


