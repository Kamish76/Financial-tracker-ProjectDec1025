import { createAdminClient } from "@/lib/supabase/server"
import { requireOrgMembership } from "@/lib/auth/guards"
import { RecordsPageContent } from "./records-page-content"

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function RecordsPage({ params }: PageProps) {
  const { id } = await params
  await requireOrgMembership(id)

  const adminClient = createAdminClient()
  const { data: organization } = await adminClient
    .from('organizations')
    .select('currency')
    .eq('id', id)
    .maybeSingle()

  return (
    <div className="p-6">
      <RecordsPageContent currency={organization?.currency} />
    </div>
  )
}
