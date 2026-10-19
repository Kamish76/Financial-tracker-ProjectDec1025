import { redirect } from "next/navigation"
import { requireOrgRole } from "@/lib/auth/guards"
import { createAdminClient } from "@/lib/supabase/server"
import { getOrganizationStats } from "@/lib/finance"
import { HoldingsManager } from "./holdings-manager"

export default async function HoldingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: orgId } = await params
  await requireOrgRole(orgId, ['owner'])

  const admin = createAdminClient()

  // Fetch organization stats and currency in parallel
  const [stats, { data: organization }, { data: members, error: membersError }] = await Promise.all([
    getOrganizationStats(orgId),
    admin.from("organizations").select("currency").eq("id", orgId).maybeSingle(),
    admin
      .from("organization_members")
      .select("user_id, role")
      .eq("organization_id", orgId)
      .eq("is_active", true),
  ])

  if (membersError) {
    console.error("Failed to fetch members", membersError.message)
    redirect(`/organizations/${orgId}`)
  }

  // Calculate baseline allocations per member (excluding Refund withdrawals)
  const { data: allocationRows } = await admin
    .from("transactions")
    .select("type, amount, category, funded_by_user_id")
    .eq("organization_id", orgId)
    .in("type", ["held_allocate", "held_return"])

  const baselineByUser: Record<string, number> = {}
  for (const row of allocationRows || []) {
    const uid = row.funded_by_user_id as string
    if (!uid) continue
    const amount = Number(row.amount ?? 0)
    const isRefund = (row.category || "").toLowerCase() === "refund"
    if (row.type === "held_allocate") {
      baselineByUser[uid] = (baselineByUser[uid] ?? 0) + amount
    } else if (row.type === "held_return" && !isRefund) {
      baselineByUser[uid] = (baselineByUser[uid] ?? 0) - amount
    }
  }

  // Merge member data using emails already resolved in getOrganizationStats
  const membersWithData = (members || []).map((m) => {
    const memberBalance = stats.members.find((mb) => mb.user_id === m.user_id)
    return {
      user_id: m.user_id,
      email: memberBalance?.email ?? null,
      role: m.role,
      businessHeld: memberBalance?.businessHeld ?? 0,
      baseline: baselineByUser[m.user_id] ?? 0,
    }
  })

  const totalAllocated = Object.values(baselineByUser).reduce((sum, val) => sum + val, 0)

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Business Held Allocations</h1>
        <p className="text-muted-foreground mt-2">
          Allocate cash on hand to members as baseline business held. Members&apos; business held
          will update dynamically as they receive income and create expenses.
        </p>
      </div>

      <HoldingsManager
        organizationId={orgId}
        members={membersWithData}
        cashOnHand={stats.totals.cashOnHand}
        totalAllocated={totalAllocated}
        currency={organization?.currency}
      />
    </div>
  )
}
