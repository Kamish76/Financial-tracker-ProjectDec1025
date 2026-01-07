"use server"

import { revalidatePath } from "next/cache"
import { createClient, createAdminClient } from "@/lib/supabase/server"

interface AddIncomeInput {
  organizationId: string
  amount: number
  description?: string
  category?: string
  occurredAt: string
}

export async function addIncome(input: AddIncomeInput) {
  const { organizationId, amount, description, category, occurredAt } = input

  if (!organizationId) {
    return { error: "Organization is required" }
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be greater than 0" }
  }

  if (!occurredAt) {
    return { error: "Date is required" }
  }

  const occurredDate = new Date(occurredAt)
  if (Number.isNaN(occurredDate.getTime())) {
    return { error: "Invalid date" }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "You must be signed in" }
  }

  // Check role: only owner/admin can insert
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) {
    console.error("[ADD_INCOME] Membership lookup failed", membershipError.message)
    return { error: "Unable to verify permissions" }
  }

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return { error: "You don’t have permission to add income" }
  }

  const insertPayload = {
    organization_id: organizationId,
    user_id: user.id,
    type: "income",
    amount,
    description: description?.trim() || null,
    category: category?.trim() || null,
    occurred_at: occurredDate.toISOString(),
    funded_by_type: "business",
    funded_by_user_id: null,
    updated_by_user_id: user.id,
  }

  // Use admin client to bypass RLS after explicit role check
  const admin = createAdminClient()
  const { error: insertError } = await admin.from("transactions").insert(insertPayload)

  if (insertError) {
    console.error("[ADD_INCOME] Insert failed", insertError.message)
    return { error: "Unable to add income right now" }
  }

  revalidatePath(`/organizations/${organizationId}`)

  return { success: true }
}
