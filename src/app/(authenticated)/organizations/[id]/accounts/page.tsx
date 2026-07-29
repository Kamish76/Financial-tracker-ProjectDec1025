import { requireOrgMembership } from '@/lib/auth/guards'
import { getAccountsWithBalances } from '@/lib/wallet-accounts'
import { AccountsClient } from './accounts-client'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AccountsPage({ params }: Props) {
  const { id } = await params
  await requireOrgMembership(id)

  const accounts = await getAccountsWithBalances(id, true)

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <AccountsClient organizationId={id} accounts={accounts} />
    </div>
  )
}


