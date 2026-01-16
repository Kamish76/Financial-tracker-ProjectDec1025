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
