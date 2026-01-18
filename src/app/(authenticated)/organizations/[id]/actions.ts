"use server"

import { revalidatePath } from "next/cache"
import { createClient, createAdminClient } from "@/lib/supabase/server"

interface AddIncomeInput {
  organizationId: string
  amount: number
  description?: string
  category?: string
  occurredAt: string
  fundedByType: 'business' | 'personal'
  fundedByUserId?: string | null
}

export async function addIncome(input: AddIncomeInput) {
  const { organizationId, amount, description, category, occurredAt, fundedByType, fundedByUserId } = input

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

  // Validate source
  // For income, we model revenue as business funds held by the recorder (user)
  const sourceType = 'business'
  const sourceUserId = user.id

  // Check role: only owner/admin can insert
  const admin = createAdminClient()
  const { data: membership, error: membershipError } = await admin
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
    funded_by_type: sourceType,
    funded_by_user_id: sourceUserId,
    updated_by_user_id: user.id,
  }

  // Use admin client to bypass RLS after explicit role check
  const { error: insertError } = await admin.from("transactions").insert(insertPayload)

  if (insertError) {
    console.error("[ADD_INCOME] Insert failed", insertError.message)
    return { error: "Unable to add income right now" }
  }

  revalidatePath(`/organizations/${organizationId}`)

  return { success: true }
}

interface AddExpenseInput {
  organizationId: string
  amount: number
  description?: string
  category?: string
  occurredAt: string
  expenseType: 'business' | 'personal'
}

export async function addExpense(input: AddExpenseInput) {
  const { organizationId, amount, description, category, occurredAt, expenseType } = input

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
  const admin = createAdminClient()
  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) {
    console.error("[ADD_EXPENSE] Membership lookup failed", membershipError.message)
    return { error: "Unable to verify permissions" }
  }

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return { error: "You don't have permission to add expenses" }
  }

  // Determine funding details based on expense type
  const transactionType = expenseType === 'personal' ? 'expense_personal' : 'expense_business'
  const fundedByType = expenseType === 'personal' ? 'personal' : 'business'
  const fundedByUserId = user.id // Current user is always the payer/holder

  const insertPayload = {
    organization_id: organizationId,
    user_id: user.id,
    type: transactionType,
    amount,
    description: description?.trim() || null,
    category: category?.trim() || null,
    occurred_at: occurredDate.toISOString(),
    funded_by_type: fundedByType,
    funded_by_user_id: fundedByUserId,
    updated_by_user_id: user.id,
  }

  // Use admin client to bypass RLS after explicit role check
  const { error: insertError } = await admin.from("transactions").insert(insertPayload)

  if (insertError) {
    console.error("[ADD_EXPENSE] Insert failed", insertError.message)
    return { error: "Unable to add expense right now" }
  }

  revalidatePath(`/organizations/${organizationId}`)

  return { success: true }
}

interface AddInitialTransactionInput {
  organizationId: string
  transactionType: 'income' | 'expense_business' | 'expense_personal'
  amount: number
  description?: string
  category?: string
  occurredAt: string
  assignedToUserId?: string | null // null means "Organization" (no specific member)
}

export async function addInitialTransaction(input: AddInitialTransactionInput) {
  const { organizationId, transactionType, amount, description, category, occurredAt, assignedToUserId } = input

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

  // Check role: only owner can add initial transactions
  const admin = createAdminClient()
  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) {
    console.error("[ADD_INITIAL_TRANSACTION] Membership lookup failed", membershipError.message)
    return { error: "Unable to verify permissions" }
  }

  if (!membership || membership.role !== "owner") {
    return { error: "Only organization owners can add initial transactions" }
  }

  // Validate assigned member if provided
  if (assignedToUserId) {
    const { data: memberCheck, error: memberCheckError } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("user_id", assignedToUserId)
      .maybeSingle()

    if (memberCheckError || !memberCheck) {
      return { error: "Selected member is not part of this organization" }
    }
  }

  // Determine funding details based on transaction type
  let fundedByType: 'business' | 'personal'
  let fundedByUserId: string | null

  if (transactionType === 'income') {
    fundedByType = 'business'
    fundedByUserId = assignedToUserId || null
  } else if (transactionType === 'expense_personal') {
    fundedByType = 'personal'
    fundedByUserId = assignedToUserId || null
  } else {
    fundedByType = 'business'
    fundedByUserId = assignedToUserId || null
  }

  const insertPayload = {
    organization_id: organizationId,
    user_id: user.id, // Owner who created this initial transaction (audit trail)
    type: transactionType,
    amount,
    description: description?.trim() || null,
    category: category?.trim() || null,
    occurred_at: occurredDate.toISOString(),
    funded_by_type: fundedByType,
    funded_by_user_id: fundedByUserId,
    updated_by_user_id: user.id,
    is_initial: true,
  }

  // Use admin client to bypass RLS after explicit role check
  const { error: insertError } = await admin.from("transactions").insert(insertPayload)

  if (insertError) {
    console.error("[ADD_INITIAL_TRANSACTION] Insert failed", insertError.message)
    return { error: "Unable to add initial transaction right now" }
  }

  revalidatePath(`/organizations/${organizationId}`)
  revalidatePath(`/organizations/${organizationId}/settings`)

  return { success: true }
}

interface DeleteInitialTransactionInput {
  organizationId: string
  transactionId: string
}

interface UpdateInitialTransactionInput {
  organizationId: string
  transactionId: string
  amount: number
  description?: string
  category?: string
  occurredAt: string
  assignedToUserId?: string | null
}

export async function updateInitialTransaction(input: UpdateInitialTransactionInput) {
  const { organizationId, transactionId, amount, description, category, occurredAt, assignedToUserId } = input

  if (!organizationId || !transactionId) {
    return { error: "Organization and transaction are required" }
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

  // Owner-only guard
  const admin = createAdminClient()
  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) {
    console.error("[UPDATE_INITIAL_TRANSACTION] Membership lookup failed", membershipError.message)
    return { error: "Unable to verify permissions" }
  }

  if (!membership || membership.role !== "owner") {
    return { error: "Only organization owners can edit initial transactions" }
  }

  // Load existing transaction to enforce org match, initial flag, and immutable type
  const { data: existingTx, error: txError } = await admin
    .from("transactions")
    .select("id, organization_id, type, is_initial")
    .eq("id", transactionId)
    .maybeSingle()

  if (txError || !existingTx) {
    return { error: "Transaction not found" }
  }

  if (existingTx.organization_id !== organizationId) {
    return { error: "Transaction does not belong to this organization" }
  }

  if (!existingTx.is_initial) {
    return { error: "Cannot edit non-initial transactions through this action" }
  }

  // Validate assigned member if provided
  if (assignedToUserId) {
    const { data: memberCheck, error: memberCheckError } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("user_id", assignedToUserId)
      .maybeSingle()

    if (memberCheckError || !memberCheck) {
      return { error: "Selected member is not part of this organization" }
    }
  }

  // Determine funding details based on immutable type
  let fundedByType: "business" | "personal" = "business"
  if (existingTx.type === "expense_personal") {
    fundedByType = "personal"
  }

  const updatePayload = {
    amount,
    description: description?.trim() || null,
    category: category?.trim() || null,
    occurred_at: occurredDate.toISOString(),
    funded_by_type: fundedByType,
    funded_by_user_id: assignedToUserId || null,
    updated_by_user_id: user.id,
  }

  const { error: updateError } = await admin
    .from("transactions")
    .update(updatePayload)
    .eq("id", transactionId)
    .eq("organization_id", organizationId)

  if (updateError) {
    console.error("[UPDATE_INITIAL_TRANSACTION] Update failed", updateError.message)
    return { error: "Unable to update transaction right now" }
  }

  revalidatePath(`/organizations/${organizationId}`)
  revalidatePath(`/organizations/${organizationId}/settings`)

  return { success: true }
}

export async function deleteInitialTransaction(input: DeleteInitialTransactionInput) {
  const { organizationId, transactionId } = input

  if (!organizationId || !transactionId) {
    return { error: "Organization and transaction are required" }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "You must be signed in" }
  }

  // Check role: only owner can delete initial transactions
  const admin = createAdminClient()
  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) {
    console.error("[DELETE_INITIAL_TRANSACTION] Membership lookup failed", membershipError.message)
    return { error: "Unable to verify permissions" }
  }

  if (!membership || membership.role !== "owner") {
    return { error: "Only organization owners can delete initial transactions" }
  }

  // Verify transaction exists, belongs to org, and is initial
  const { data: transaction, error: txError } = await admin
    .from("transactions")
    .select("id, is_initial")
    .eq("id", transactionId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (txError || !transaction) {
    return { error: "Transaction not found" }
  }

  if (!transaction.is_initial) {
    return { error: "Cannot delete non-initial transactions through this action" }
  }

  // Delete the transaction
  const { error: deleteError } = await admin
    .from("transactions")
    .delete()
    .eq("id", transactionId)

  if (deleteError) {
    console.error("[DELETE_INITIAL_TRANSACTION] Delete failed", deleteError.message)
    return { error: "Unable to delete transaction right now" }
  }

  revalidatePath(`/organizations/${organizationId}`)
  revalidatePath(`/organizations/${organizationId}/settings`)

  return { success: true }
}

interface SetMemberBaselineInput {
  organizationId: string
  userId: string
  targetBaseline: number // desired baseline allocation amount
}

export async function setMemberBaseline(input: SetMemberBaselineInput) {
  const { organizationId, userId, targetBaseline } = input

  if (!organizationId || !userId) {
    return { error: "Organization and user are required" }
  }

  if (!Number.isFinite(targetBaseline) || targetBaseline < 0) {
    return { error: "Target baseline must be a non-negative number" }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "You must be signed in" }
  }

  // Check role: only owner can set baseline allocations
  const admin = createAdminClient()
  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) {
    console.error("[SET_MEMBER_BASELINE] Membership lookup failed", membershipError.message)
    return { error: "Unable to verify permissions" }
  }

  if (!membership || membership.role !== "owner") {
    return { error: "Only organization owners can set baseline allocations" }
  }

  // Verify target member exists in organization
  const { data: targetMember, error: targetMemberError } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle()

  if (targetMemberError || !targetMember) {
    return { error: "Target member is not part of this organization" }
  }

  // Get current baseline allocation for this member (sum of held_allocate - held_return)
  const { data: allocationRows, error: allocationError } = await admin
    .from("transactions")
    .select("type, amount")
    .eq("organization_id", organizationId)
    .eq("funded_by_user_id", userId)
    .in("type", ["held_allocate", "held_return"])

  if (allocationError) {
    console.error("[SET_MEMBER_BASELINE] Failed to fetch allocations", allocationError.message)
    return { error: "Unable to calculate current baseline" }
  }

  let currentBaseline = 0
  for (const row of allocationRows || []) {
    const amount = Number(row.amount ?? 0)
    if (row.type === "held_allocate") {
      currentBaseline += amount
    } else if (row.type === "held_return") {
      currentBaseline -= amount
    }
  }

  const delta = targetBaseline - currentBaseline

  // If no change needed, return early
  if (Math.abs(delta) < 0.01) {
    return { success: true }
  }

  // Determine transaction type based on delta
  const transactionType = delta > 0 ? "held_allocate" : "held_return"
  const transactionAmount = Math.abs(delta)

  // Get cash on hand to validate allocation limit
  const { data: txRows, error: txError } = await admin
    .from("transactions")
    .select("type, amount")
    .eq("organization_id", organizationId)

  if (txError) {
    console.error("[SET_MEMBER_BASELINE] Failed to fetch transactions", txError.message)
    return { error: "Unable to validate allocation limit" }
  }

  let totalIncome = 0
  let totalExpensesBusiness = 0
  for (const r of txRows || []) {
    const amount = Number(r.amount ?? 0)
    if (r.type === "income") totalIncome += amount
    if (r.type === "expense_business") totalExpensesBusiness += amount
  }
  const cashOnHand = totalIncome - totalExpensesBusiness

  // Calculate total allocated baseline across all members
  const { data: allAllocations, error: allAllocationsError } = await admin
    .from("transactions")
    .select("type, amount, funded_by_user_id")
    .eq("organization_id", organizationId)
    .in("type", ["held_allocate", "held_return"])

  if (allAllocationsError) {
    console.error("[SET_MEMBER_BASELINE] Failed to fetch all allocations", allAllocationsError.message)
    return { error: "Unable to validate total allocation" }
  }

  const baselineByUser: Record<string, number> = {}
  for (const row of allAllocations || []) {
    const uid = row.funded_by_user_id as string
    if (!uid) continue
    const amount = Number(row.amount ?? 0)
    if (row.type === "held_allocate") {
      baselineByUser[uid] = (baselineByUser[uid] ?? 0) + amount
    } else if (row.type === "held_return") {
      baselineByUser[uid] = (baselineByUser[uid] ?? 0) - amount
    }
  }

  // Update the target user's baseline in our map
  baselineByUser[userId] = targetBaseline

  // Calculate new total allocated
  const totalAllocated = Object.values(baselineByUser).reduce((sum, val) => sum + val, 0)

  if (totalAllocated > cashOnHand) {
    return { error: `Total allocated (${totalAllocated.toFixed(2)}) cannot exceed cash on hand (${cashOnHand.toFixed(2)})` }
  }

  // Insert the transaction
  const insertPayload = {
    organization_id: organizationId,
    user_id: user.id, // Owner who made this allocation
    type: transactionType,
    amount: transactionAmount,
    description: `Baseline allocation ${delta > 0 ? 'increase' : 'decrease'} by owner`,
    category: "Allocation",
    occurred_at: new Date().toISOString(),
    funded_by_type: "business" as const,
    funded_by_user_id: userId, // The member receiving/returning the allocation
    updated_by_user_id: user.id,
    is_initial: false,
  }

  const { error: insertError } = await admin.from("transactions").insert(insertPayload)

  if (insertError) {
    console.error("[SET_MEMBER_BASELINE] Insert failed", insertError.message)
    return { error: "Unable to set baseline allocation right now" }
  }

  revalidatePath(`/organizations/${organizationId}`)
  revalidatePath(`/organizations/${organizationId}/settings`)
  revalidatePath(`/organizations/${organizationId}/settings/holdings`)

  return { success: true }
}
