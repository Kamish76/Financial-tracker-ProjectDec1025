import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getOrganizationStats } from "@/lib/finance"
import { HoldingsManager } from "./holdings-manager"

export default async function HoldingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: orgId } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth")
  }

  const admin = createAdminClient()
  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError || !membership) {
    redirect("/")
  }

  // Only owner can access holdings page
  if (membership.role !== "owner") {
    redirect(`/organizations/${orgId}`)
  }

  // Fetch organization stats
  const stats = await getOrganizationStats(orgId)

  // Fetch all members with emails
  const { data: members, error: membersError } = await admin
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", orgId)

  if (membersError) {
    console.error("Failed to fetch members", membersError.message)
    redirect(`/organizations/${orgId}`)
  }

  // Fetch emails
  const userIds = members?.map((m) => m.user_id) || []
  const emailByUserId: Record<string, string | null> = {}
  
  if (userIds.length > 0) {
    try {
      const { data: authUsers } = await admin
        .from("auth.users")
        .select("id, email")
        .in("id", userIds)
      for (const u of authUsers || []) {
        emailByUserId[u.id] = u.email ?? null
      }
    } catch (e) {
      console.error("Failed to fetch emails", e)
    }
  }

  // Calculate baseline allocations per member
  const { data: allocationRows } = await admin
    .from("transactions")
    .select("type, amount, funded_by_user_id")
    .eq("organization_id", orgId)
    .in("type", ["held_allocate", "held_return"])

  const baselineByUser: Record<string, number> = {}
  for (const row of allocationRows || []) {
    const uid = row.funded_by_user_id as string
    if (!uid) continue
    const amount = Number(row.amount ?? 0)
    if (row.type === "held_allocate") {
      baselineByUser[uid] = (baselineByUser[uid] ?? 0) + amount
    } else if (row.type === "held_return") {
      baselineByUser[uid] = (baselineByUser[uid] ?? 0) - amount
    }
  }

  // Merge member data
  const membersWithData = (members || []).map((m) => {
    const memberBalance = stats.members.find((mb) => mb.user_id === m.user_id)
    return {
      user_id: m.user_id,
      email: emailByUserId[m.user_id] ?? null,
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
      />
    </div>
  )
}
