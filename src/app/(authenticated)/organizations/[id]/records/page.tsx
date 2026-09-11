import { createAdminClient } from "@/lib/supabase/server"
import { RecordsPageContent } from "./records-page-content"

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function RecordsPage({ params }: PageProps) {
  const { id } = await params
  const adminClient = createAdminClient()
  const { data: organization } = await adminClient
    .from('organizations')
    .select('currency')
    .eq('id', id)
    .single()

  return (
    <div className="p-6">
      <RecordsPageContent currency={organization?.currency} />
    </div>
  )
}
