"use server"

import { revalidatePath } from "next/cache"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getOrCreateCategory } from "@/lib/categories"

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

  // Normalize and get category ID
  const categoryId = category ? await getOrCreateCategory(organizationId, category) : null

  const insertPayload = {
    organization_id: organizationId,
    user_id: user.id,
    type: "income",
    amount,
    description: description?.trim() || null,
    category: category?.trim() || null,
    category_id: categoryId,
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

interface UpdateTransactionInput {
  organizationId: string
  transactionId: string
  amount: number
  description?: string
  category?: string
  occurredAt: string
}

export async function updateTransaction(input: UpdateTransactionInput) {
  const { organizationId, transactionId, amount, description, category, occurredAt } = input

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
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "You must be signed in" }
  }

  const admin = createAdminClient()

  // Verify user is owner or admin
  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError || !membership) {
    console.error("[UPDATE_TRANSACTION] Membership lookup failed", membershipError?.message)
    return { error: "Unable to verify permissions" }
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    return { error: "You don't have permission to edit transactions" }
  }

  // Verify transaction belongs to organization
  const { data: existingTx, error: txError } = await admin
    .from("transactions")
    .select("id, organization_id")
    .eq("id", transactionId)
    .maybeSingle()

  if (txError || !existingTx) {
    return { error: "Transaction not found" }
  }

  if (existingTx.organization_id !== organizationId) {
    return { error: "Transaction does not belong to this organization" }
  }

  // Normalize category if provided
  const categoryId = category ? await getOrCreateCategory(organizationId, category) : null

  const updatePayload = {
    amount,
    description: description?.trim() || null,
    category: category?.trim() || null,
    category_id: categoryId,
    occurred_at: occurredDate.toISOString(),
    updated_by_user_id: user.id,
  }

  const { error: updateError } = await admin
    .from("transactions")
    .update(updatePayload)
    .eq("id", transactionId)

  if (updateError) {
    console.error("[UPDATE_TRANSACTION] Update failed", updateError.message)
    return { error: "Unable to update transaction" }
  }

  revalidatePath(`/organizations/${organizationId}`)
  revalidatePath(`/organizations/${organizationId}/records`)

  return { success: true }
}

interface DeleteTransactionInput {
  organizationId: string
  transactionId: string
}

export async function deleteTransaction(input: DeleteTransactionInput) {
  const { organizationId, transactionId } = input

  if (!organizationId || !transactionId) {
    return { error: "Organization and transaction are required" }
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "You must be signed in" }
  }

  const admin = createAdminClient()

  // Verify user is owner or admin
  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError || !membership) {
    console.error("[DELETE_TRANSACTION] Membership lookup failed", membershipError?.message)
    return { error: "Unable to verify permissions" }
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    return { error: "You don't have permission to delete transactions" }
  }

  // Verify transaction belongs to organization
  const { data: existingTx, error: txError } = await admin
    .from("transactions")
    .select("id, organization_id")
    .eq("id", transactionId)
    .maybeSingle()

  if (txError || !existingTx) {
    return { error: "Transaction not found" }
  }

  if (existingTx.organization_id !== organizationId) {
    return { error: "Transaction does not belong to this organization" }
  }

  const { error: deleteError } = await admin
    .from("transactions")
    .delete()
    .eq("id", transactionId)

  if (deleteError) {
    console.error("[DELETE_TRANSACTION] Delete failed", deleteError.message)
    return { error: "Unable to delete transaction" }
  }

  revalidatePath(`/organizations/${organizationId}`)
  revalidatePath(`/organizations/${organizationId}/records`)

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

  // Normalize and get category ID
  const categoryId = category ? await getOrCreateCategory(organizationId, category) : null

  const insertPayload = {
    organization_id: organizationId,
    user_id: user.id,
    type: transactionType,
    amount,
    description: description?.trim() || null,
    category: category?.trim() || null,
    category_id: categoryId,
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

  // Normalize and get category ID
  const categoryId = category ? await getOrCreateCategory(organizationId, category) : null

  const insertPayload = {
    organization_id: organizationId,
    user_id: user.id, // Owner who created this initial transaction (audit trail)
    type: transactionType,
    amount,
    description: description?.trim() || null,
    category: category?.trim() || null,
    category_id: categoryId,
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

  // Normalize and get category ID
  const categoryId = category ? await getOrCreateCategory(organizationId, category) : null

  const updatePayload = {
    amount,
    description: description?.trim() || null,
    category: category?.trim() || null,
    category_id: categoryId,
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

// New: Owner-only actions to add regular transactions on behalf of members
interface AddIncomeForMemberInput {
  organizationId: string
  amount: number
  description?: string
  category?: string
  occurredAt: string
  assignedToUserId?: string | null
}

export async function addIncomeForMember(input: AddIncomeForMemberInput) {
  const { organizationId, amount, description, category, occurredAt, assignedToUserId } = input

  if (!organizationId) return { error: "Organization is required" }
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be greater than 0" }
  if (!occurredAt) return { error: "Date is required" }

  const occurredDate = new Date(occurredAt)
  if (Number.isNaN(occurredDate.getTime())) return { error: "Invalid date" }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: "You must be signed in" }

  const admin = createAdminClient()
  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) {
    console.error("[ADD_INCOME_FOR_MEMBER] Membership lookup failed", membershipError.message)
    return { error: "Unable to verify permissions" }
  }

  if (!membership || membership.role !== "owner") {
    return { error: "Only organization owners can add income for members" }
  }

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

  const insertPayload = {
    organization_id: organizationId,
    user_id: user.id, // owner recording the transaction
    type: "income" as const,
    amount,
    description: description?.trim() || null,
    category: category?.trim() || null,
    category_id: category ? await getOrCreateCategory(organizationId, category) : null,
    occurred_at: occurredDate.toISOString(),
    funded_by_type: "business" as const,
    funded_by_user_id: assignedToUserId || null,
    updated_by_user_id: user.id,
    is_initial: false,
  }

  const { error: insertError } = await admin.from("transactions").insert(insertPayload)
  if (insertError) {
    console.error("[ADD_INCOME_FOR_MEMBER] Insert failed", insertError.message)
    return { error: "Unable to add income right now" }
  }

  revalidatePath(`/organizations/${organizationId}`)
  revalidatePath(`/organizations/${organizationId}/settings`)
  return { success: true }
}

interface AddExpenseForMemberInput {
  organizationId: string
  amount: number
  description?: string
  category?: string
  occurredAt: string
  expenseType: 'business' | 'personal'
  assignedToUserId?: string | null
}

export async function addExpenseForMember(input: AddExpenseForMemberInput) {
  const { organizationId, amount, description, category, occurredAt, expenseType, assignedToUserId } = input

  if (!organizationId) return { error: "Organization is required" }
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be greater than 0" }
  if (!occurredAt) return { error: "Date is required" }

  const occurredDate = new Date(occurredAt)
  if (Number.isNaN(occurredDate.getTime())) return { error: "Invalid date" }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: "You must be signed in" }

  const admin = createAdminClient()
  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) {
    console.error("[ADD_EXPENSE_FOR_MEMBER] Membership lookup failed", membershipError.message)
    return { error: "Unable to verify permissions" }
  }

  if (!membership || membership.role !== "owner") {
    return { error: "Only organization owners can add expenses for members" }
  }

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

  const transactionType = expenseType === 'personal' ? 'expense_personal' : 'expense_business'
  const fundedByType = expenseType === 'personal' ? 'personal' : 'business'

  const insertPayload = {
    organization_id: organizationId,
    user_id: user.id, // owner recording the transaction
    type: transactionType,
    amount,
    description: description?.trim() || null,
    category: category?.trim() || null,
    category_id: category ? await getOrCreateCategory(organizationId, category) : null,
    occurred_at: occurredDate.toISOString(),
    funded_by_type: fundedByType,
    funded_by_user_id: assignedToUserId || null,
    updated_by_user_id: user.id,
    is_initial: false,
  }

  const { error: insertError } = await admin.from("transactions").insert(insertPayload)
  if (insertError) {
    console.error("[ADD_EXPENSE_FOR_MEMBER] Insert failed", insertError.message)
    return { error: "Unable to add expense right now" }
  }

  revalidatePath(`/organizations/${organizationId}`)
  revalidatePath(`/organizations/${organizationId}/settings`)
  return { success: true }
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

interface CreateRefundInput {
  organizationId: string
  amount: number
  description?: string
}

export async function createRefund(input: CreateRefundInput) {
  const { organizationId, amount, description } = input

  if (!organizationId) {
    return { error: "Organization is required" }
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be greater than 0" }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "You must be signed in" }
  }

  // Check role: only owner/admin can create refunds
  const admin = createAdminClient()
  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) {
    console.error("[CREATE_REFUND] Membership lookup failed", membershipError.message)
    return { error: "Unable to verify permissions" }
  }

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return { error: "You don't have permission to create refunds" }
  }

  // Get current user's outstanding reimbursable amount
  const { data: txRows, error: txError } = await admin
    .from("transactions")
    .select("type, amount, funded_by_type, funded_by_user_id")
    .eq("organization_id", organizationId)

  if (txError) {
    console.error("[CREATE_REFUND] Transactions fetch error", txError.message)
    return { error: "Unable to fetch transaction data" }
  }

  // Calculate current user's personal contributions
  let contributedPersonal = 0
  for (const r of txRows || []) {
    const txAmount = Number(r.amount ?? 0)
    const type = r.type as string
    const isPersonalFunded = (r.funded_by_type as string | null) === 'personal'
    const fundedByUserId = r.funded_by_user_id as string | null

    if (isPersonalFunded && fundedByUserId === user.id && type === 'expense_personal') {
      contributedPersonal += txAmount
    }
  }

  // Get current user's reimbursements paid
  const { data: reimbursementRows, error: reimbError } = await admin
    .from("reimbursement_requests")
    .select("amount, status")
    .eq("organization_id", organizationId)
    .eq("from_user_id", user.id)
    .eq("status", "paid")

  if (reimbError) {
    console.error("[CREATE_REFUND] Reimbursements fetch error", reimbError.message)
    return { error: "Unable to fetch reimbursement data" }
  }

  let reimbursementsPaid = 0
  for (const r of reimbursementRows || []) {
    reimbursementsPaid += Number(r.amount ?? 0)
  }

  const outstanding = Math.max(contributedPersonal - reimbursementsPaid, 0)

  if (outstanding <= 0) {
    return { error: "You have no outstanding balance to refund" }
  }

  if (amount > outstanding) {
    return { error: `Amount exceeds outstanding balance of $${outstanding.toFixed(2)}` }
  }

  // Create reimbursement request with status = 'paid' (no approval needed)
  const { error: insertError } = await admin
    .from("reimbursement_requests")
    .insert({
      organization_id: organizationId,
      from_user_id: user.id,
      amount,
      status: "paid",
      approval_required: false,
      notes: description?.trim() || null,
    })

  if (insertError) {
    console.error("[CREATE_REFUND] Reimbursement insert failed", insertError.message)
    return { error: "Unable to create refund right now" }
  }

  // Also create a held_return transaction to deduct from user's business held balance
  const { error: txInsertError } = await admin
    .from("transactions")
    .insert({
      organization_id: organizationId,
      user_id: user.id,
      type: "held_return",
      amount,
      description: `Refund withdrawal${description ? ': ' + description : ''}`,
      category: "Refund",
      occurred_at: new Date().toISOString(),
      funded_by_type: "business" as const,
      funded_by_user_id: user.id,
      updated_by_user_id: user.id,
      is_initial: false,
    })

  if (txInsertError) {
    console.error("[CREATE_REFUND] Transaction insert failed", txInsertError.message)
    return { error: "Unable to record refund transaction" }
  }

  revalidatePath(`/organizations/${organizationId}`)

  return { success: true }
}
