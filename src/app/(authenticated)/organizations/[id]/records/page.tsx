import { createAdminClient } from "@/lib/supabase/server"
import { requireOrgMembership } from "@/lib/auth/guards"
import { RecordsPageContent } from "./records-page-content"
import { isWalletOrganization } from "@/lib/wallet"

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function RecordsPage({ params }: PageProps) {
  const { id } = await params
  const { membership } = await requireOrgMembership(id)

  const adminClient = createAdminClient()
  const { data: organization } = await adminClient
    .from('organizations')
    .select('description, currency')
    .eq('id', id)
    .maybeSingle()

  const isWallet = isWalletOrganization(organization?.description)

  return (
    <div className="p-6">
      <RecordsPageContent
        currency={organization?.currency}
        isWallet={isWallet}
        userRole={membership.role}
      />
    </div>
  )
}
