"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getOrCreateCategory } from "@/lib/categories"
import { authorizeOrgAction } from "@/lib/auth/guards"
import { getUserWalletId } from "@/lib/wallet-server"
import {
  revalidateOrganizationSections,
} from "@/lib/revalidation"
import { normalizeTransactionAmount } from "@/lib/utils"

type OrgClient = ReturnType<typeof createAdminClient>
type AllowedRoles = Parameters<typeof authorizeOrgAction>[1]

async function verifyActiveOrgMember(
  admin: OrgClient,
  organizationId: string,
  userId: string,
  notFoundError = "Selected member is not part of this organization"
): Promise<{ error: string } | null> {
  const { data: memberCheck, error: memberCheckError } = await admin
    .from("organization_members")
    .select("organization_id, user_id, is_active")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle()

  if (memberCheckError || !memberCheck) {
    return { error: notFoundError }
  }
  return null
}

interface ResolvedMirrorTarget {
  walletOrgId: string
  linkedAccountId: string
  targetAccountId: string
  orgName: string
}

async function resolveMirrorTarget(
  admin: OrgClient,
  organizationId: string,
  userId: string,
  mirrorWalletAccountId: string
): Promise<ResolvedMirrorTarget | { error: string }> {
  const walletOrgId = await getUserWalletId(userId)
  if (!walletOrgId || walletOrgId === organizationId) {
    return { error: "Personal wallet not found for mirroring" }
  }

  const [{ data: walletAccounts, error: accError }, { data: orgData }] = await Promise.all([
    admin
      .from("wallet_accounts")
      .select("id, name, is_active, linked_org_id")
      .eq("organization_id", walletOrgId)
      .eq("is_active", true),
    admin.from("organizations").select("name").eq("id", organizationId).maybeSingle(),
  ])

  const linkedAccount = (walletAccounts || []).find((a) => a.linked_org_id === organizationId)
  const targetAccount = (walletAccounts || []).find(
    (a) => a.id === mirrorWalletAccountId && !a.linked_org_id
  )

  if (accError || !linkedAccount || !targetAccount) {
    return {
      error:
        "Selected wallet sub-account is invalid or this organization is not linked to an active wallet sub-account",
    }
  }

  return {
    walletOrgId,
    linkedAccountId: linkedAccount.id,
    targetAccountId: targetAccount.id,
    orgName: orgData?.name?.trim() || "Org",
  }
}

async function createMirroredWalletTransfer(params: {
  admin: OrgClient
  target: ResolvedMirrorTarget
  userId: string
  orgTxId: string
  txType: 'income' | 'expense_business'
  amount: number
  description?: string | null
  occurredAtIso: string
}): Promise<{ mirroredTransferId?: string; walletOrgId?: string; error?: string }> {
  const { admin, target, userId, orgTxId, txType, amount, description, occurredAtIso } = params

  const fromAccountId =
    txType === "income" ? target.linkedAccountId : target.targetAccountId
  const toAccountId =
    txType === "income" ? target.targetAccountId : target.linkedAccountId

  const prefix = `[${target.orgName}]`
  const fallbackLabel = txType === "income" ? "Income" : "Business expense"
  const mirrorDesc = description?.trim() ? `${prefix} ${description.trim()}` : `${prefix} ${fallbackLabel}`

  const { data: mirrorTx, error: mirrorError } = await admin
    .from("transactions")
    .insert({
      organization_id: target.walletOrgId,
      user_id: userId,
      type: "transfer",
      amount,
      account_id: fromAccountId,
      transfer_to_account_id: toAccountId,
      category: "Transfer",
      description: mirrorDesc,
      occurred_at: occurredAtIso,
      funded_by_type: "personal",
      funded_by_user_id: userId,
      updated_by_user_id: userId,
      is_initial: false,
      mirrored_from_tx_id: orgTxId,
    })
    .select("id")
    .single()

  if (mirrorError || !mirrorTx) {
    console.error("[AUTO_MIRROR] Transfer insert failed", mirrorError?.message)
    return { error: "Unable to create mirrored wallet transfer" }
  }

  revalidateOrganizationSections(target.walletOrgId, ["records", "accounts"])
  return { mirroredTransferId: mirrorTx.id, walletOrgId: target.walletOrgId }
}

interface InsertOrgTransactionParams {
  organizationId: string
  amount: number
  description?: string
  category?: string
  occurredAt: string
  allowedRoles: AllowedRoles
  permissionError: string
  txType: 'income' | 'expense_business' | 'expense_personal'
  fundedByType: 'business' | 'personal'
  fundedByUserId?: string | null
  useCurrentUserAsFallback?: boolean
  validateAssignedMember?: boolean
  isInitial?: boolean
  mirrorWalletAccountId?: string | null
  logTag: string
  insertFailedError: string
}

async function insertOrgTransaction(params: InsertOrgTransactionParams) {
  const {
    organizationId,
    amount,
    description,
    category,
    occurredAt,
    allowedRoles,
    permissionError,
    txType,
    fundedByType,
    fundedByUserId,
    useCurrentUserAsFallback = false,
    validateAssignedMember = false,
    isInitial,
    mirrorWalletAccountId,
    logTag,
    insertFailedError,
  } = params

  if (!organizationId) {
    return { error: "Organization is required" }
  }

  const normalizedAmount = normalizeTransactionAmount(amount)
  if (normalizedAmount === null) {
    return { error: "Amount cannot be 0" }
  }

  if (!occurredAt) {
    return { error: "Date is required" }
  }

  const occurredDate = new Date(occurredAt)
  if (Number.isNaN(occurredDate.getTime())) {
    return { error: "Invalid date" }
  }

  const auth = await authorizeOrgAction(organizationId, allowedRoles, permissionError)
  if ('error' in auth) {
    return auth
  }

  const { user } = auth
  const admin = createAdminClient()

  if (validateAssignedMember && fundedByUserId) {
    const memberError = await verifyActiveOrgMember(admin, organizationId, fundedByUserId)
    if (memberError) {
      return memberError
    }
  }

  const effectiveFundedByUserId = useCurrentUserAsFallback
    ? (fundedByUserId || user.id)
    : (fundedByUserId || null)

  const normalizedMirrorAccountId = mirrorWalletAccountId?.trim() || null
  let mirrorTarget: ResolvedMirrorTarget | null = null

  if (normalizedMirrorAccountId) {
    if (txType === "expense_personal" || fundedByType !== "business") {
      return {
        error:
          "Only organization-funded income or business expenses can be mirrored to a linked wallet sub-account",
      }
    }
    if (effectiveFundedByUserId !== user.id) {
      return {
        error: "You can only mirror transactions held or paid by yourself to your personal wallet",
      }
    }
    const targetRes = await resolveMirrorTarget(
      admin,
      organizationId,
      user.id,
      normalizedMirrorAccountId
    )
    if ("error" in targetRes) {
      return { error: targetRes.error }
    }
    mirrorTarget = targetRes
  }

  const categoryKind = txType === 'income' ? 'income' : 'expense'
  const categoryId = category ? await getOrCreateCategory(organizationId, category, categoryKind) : null
  const occurredAtIso = occurredDate.toISOString()

  const insertPayload = {
    organization_id: organizationId,
    user_id: user.id,
    type: txType,
    amount: normalizedAmount,
    description: description?.trim() || null,
    category: category?.trim() || null,
    category_id: categoryId,
    occurred_at: occurredAtIso,
    funded_by_type: fundedByType,
    funded_by_user_id: effectiveFundedByUserId,
    updated_by_user_id: user.id,
    ...(isInitial !== undefined ? { is_initial: isInitial } : {}),
  }

  // Use admin client to bypass RLS after explicit role check
  let insertedOrgTxId: string | null = null
  if (mirrorTarget) {
    const { data: insertedTx, error: insertError } = await admin
      .from("transactions")
      .insert(insertPayload)
      .select("id")
      .single()

    if (insertError || !insertedTx) {
      console.error(`${logTag} Insert failed`, insertError?.message)
      return { error: insertFailedError }
    }
    insertedOrgTxId = insertedTx.id
  } else {
    const { error: insertError } = await admin.from("transactions").insert(insertPayload)

    if (insertError) {
      console.error(`${logTag} Insert failed`, insertError.message)
      return { error: insertFailedError }
    }
  }

  let mirroredTransferId: string | undefined
  if (mirrorTarget && insertedOrgTxId) {
    const mirrorRes = await createMirroredWalletTransfer({
      admin,
      target: mirrorTarget,
      userId: user.id,
      orgTxId: insertedOrgTxId,
      txType: txType as "income" | "expense_business",
      amount: normalizedAmount,
      description,
      occurredAtIso,
    })

    if (mirrorRes.error) {
      await admin.from("transactions").delete().eq("id", insertedOrgTxId)
      return { error: mirrorRes.error }
    }
    mirroredTransferId = mirrorRes.mirroredTransferId
  }

  revalidateOrganizationSections(organizationId, ['records', 'settings', 'settings/holdings'])

  return mirroredTransferId ? { success: true, mirroredTransferId } : { success: true }
}

interface AddIncomeInput {
  organizationId: string
  amount: number
  description?: string
  category?: string
  occurredAt: string
  fundedByType: 'business' | 'personal'
  fundedByUserId?: string | null
  mirrorWalletAccountId?: string | null
}

export async function addIncome(input: AddIncomeInput) {
  return insertOrgTransaction({
    organizationId: input.organizationId,
    amount: input.amount,
    description: input.description,
    category: input.category,
    occurredAt: input.occurredAt,
    allowedRoles: ['owner', 'admin'],
    permissionError: "You don't have permission to add income",
    txType: 'income',
    fundedByType: input.fundedByType,
    fundedByUserId: input.fundedByUserId,
    useCurrentUserAsFallback: true,
    mirrorWalletAccountId: input.mirrorWalletAccountId,
    logTag: '[ADD_INCOME]',
    insertFailedError: 'Unable to add income right now',
  })
}

import {
  updateTransaction as updateTransactionImpl,
  deleteTransaction as deleteTransactionImpl,
} from './records/actions'

// Delegate transaction mutations to records/actions to eliminate duplicate code (Phase 6)
export async function updateTransaction(
  organizationIdOrInput: string | { organizationId: string; transactionId?: string; id?: string; [key: string]: unknown },
  idOrData?: string | Record<string, unknown>,
  data?: Record<string, unknown>
) {
  return updateTransactionImpl(organizationIdOrInput, idOrData, data)
}

export async function deleteTransaction(
  organizationIdOrInput: string | { organizationId: string; transactionId?: string; id?: string },
  idArg?: string
) {
  return deleteTransactionImpl(organizationIdOrInput, idArg)
}

interface AddExpenseInput {
  organizationId: string
  amount: number
  description?: string
  category?: string
  occurredAt: string
  expenseType: 'business' | 'personal'
  mirrorWalletAccountId?: string | null
}

export async function addExpense(input: AddExpenseInput) {
  const transactionType = input.expenseType === 'personal' ? 'expense_personal' : 'expense_business'
  const fundedByType = input.expenseType === 'personal' ? 'personal' : 'business'

  return insertOrgTransaction({
    organizationId: input.organizationId,
    amount: input.amount,
    description: input.description,
    category: input.category,
    occurredAt: input.occurredAt,
    allowedRoles: ['owner', 'admin'],
    permissionError: "You don't have permission to add expenses",
    txType: transactionType,
    fundedByType,
    useCurrentUserAsFallback: true,
    mirrorWalletAccountId: input.mirrorWalletAccountId,
    logTag: '[ADD_EXPENSE]',
    insertFailedError: 'Unable to add expense right now',
  })
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

  const normalizedAmount = normalizeTransactionAmount(amount)
  if (normalizedAmount === null) {
    return { error: "Amount cannot be 0" }
  }

  if (!occurredAt) {
    return { error: "Date is required" }
  }

  const occurredDate = new Date(occurredAt)
  if (Number.isNaN(occurredDate.getTime())) {
    return { error: "Invalid date" }
  }

  const auth = await authorizeOrgAction(organizationId, ['owner'], "Only organization owners can add initial transactions")

  if ('error' in auth) {
    return auth
  }

  const { user } = auth
  const admin = createAdminClient()

  // Validate assigned member if provided
  if (assignedToUserId) {
    const memberError = await verifyActiveOrgMember(admin, organizationId, assignedToUserId)
    if (memberError) {
      return memberError
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
  const categoryId = category
    ? await getOrCreateCategory(organizationId, category, transactionType === 'income' ? 'income' : 'expense')
    : null

  const insertPayload = {
    organization_id: organizationId,
    user_id: user.id, // Owner who created this initial transaction (audit trail)
    type: transactionType,
    amount: normalizedAmount,
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

  revalidateOrganizationSections(organizationId, ['settings', 'records', 'settings/holdings'])

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

  const normalizedAmount = normalizeTransactionAmount(amount)
  if (normalizedAmount === null) {
    return { error: "Amount cannot be 0" }
  }

  if (!occurredAt) {
    return { error: "Date is required" }
  }

  const occurredDate = new Date(occurredAt)
  if (Number.isNaN(occurredDate.getTime())) {
    return { error: "Invalid date" }
  }

  const auth = await authorizeOrgAction(organizationId, ['owner'], "Only organization owners can edit initial transactions")

  if ('error' in auth) {
    return auth
  }

  const { user } = auth
  const admin = createAdminClient()

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
    const memberError = await verifyActiveOrgMember(admin, organizationId, assignedToUserId)
    if (memberError) {
      return memberError
    }
  }

  // Determine funding details based on immutable type
  let fundedByType: "business" | "personal" = "business"
  if (existingTx.type === "expense_personal") {
    fundedByType = "personal"
  }

  // Normalize and get category ID
  const categoryId = category
    ? await getOrCreateCategory(organizationId, category, existingTx.type === 'income' ? 'income' : 'expense')
    : null

  const updatePayload = {
    amount: normalizedAmount,
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

  revalidateOrganizationSections(organizationId, ['settings', 'records', 'settings/holdings'])

  return { success: true }
}

export async function deleteInitialTransaction(input: DeleteInitialTransactionInput) {
  const { organizationId, transactionId } = input

  if (!organizationId || !transactionId) {
    return { error: "Organization and transaction are required" }
  }

  const auth = await authorizeOrgAction(organizationId, ['owner'], "Only organization owners can delete initial transactions")

  if ('error' in auth) {
    return auth
  }

  const admin = createAdminClient()

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

  revalidateOrganizationSections(organizationId, ['settings', 'records', 'settings/holdings'])

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
  mirrorWalletAccountId?: string | null
}

export async function addIncomeForMember(input: AddIncomeForMemberInput) {
  return insertOrgTransaction({
    organizationId: input.organizationId,
    amount: input.amount,
    description: input.description,
    category: input.category,
    occurredAt: input.occurredAt,
    allowedRoles: ['owner'],
    permissionError: "Only organization owners can add income for members",
    txType: 'income',
    fundedByType: 'business',
    fundedByUserId: input.assignedToUserId,
    validateAssignedMember: true,
    isInitial: false,
    mirrorWalletAccountId: input.mirrorWalletAccountId,
    logTag: '[ADD_INCOME_FOR_MEMBER]',
    insertFailedError: 'Unable to add income right now',
  })
}

interface AddExpenseForMemberInput {
  organizationId: string
  amount: number
  description?: string
  category?: string
  occurredAt: string
  expenseType: 'business' | 'personal'
  assignedToUserId?: string | null
  mirrorWalletAccountId?: string | null
}

export async function addExpenseForMember(input: AddExpenseForMemberInput) {
  const transactionType = input.expenseType === 'personal' ? 'expense_personal' : 'expense_business'
  const fundedByType = input.expenseType === 'personal' ? 'personal' : 'business'

  return insertOrgTransaction({
    organizationId: input.organizationId,
    amount: input.amount,
    description: input.description,
    category: input.category,
    occurredAt: input.occurredAt,
    allowedRoles: ['owner'],
    permissionError: "Only organization owners can add expenses for members",
    txType: transactionType,
    fundedByType,
    fundedByUserId: input.assignedToUserId,
    validateAssignedMember: true,
    isInitial: false,
    mirrorWalletAccountId: input.mirrorWalletAccountId,
    logTag: '[ADD_EXPENSE_FOR_MEMBER]',
    insertFailedError: 'Unable to add expense right now',
  })
}

export async function setMemberBaseline(input: SetMemberBaselineInput) {
  const { organizationId, userId, targetBaseline } = input

  if (!organizationId || !userId) {
    return { error: "Organization and user are required" }
  }

  if (!Number.isFinite(targetBaseline) || targetBaseline < 0) {
    return { error: "Target baseline must be a non-negative number" }
  }

  const auth = await authorizeOrgAction(organizationId, ['owner'], "Only organization owners can set baseline allocations")

  if ('error' in auth) {
    return auth
  }

  const { user } = auth
  const admin = createAdminClient()

  // Verify target member exists in organization
  const memberError = await verifyActiveOrgMember(
    admin,
    organizationId,
    userId,
    "Target member is not part of this organization"
  )
  if (memberError) {
    return memberError
  }

  // Fetch all baseline allocations once to derive both the member's current baseline and org-wide limit
  const { data: allAllocations, error: allAllocationsError } = await admin
    .from("transactions")
    .select("type, amount, category, funded_by_user_id")
    .eq("organization_id", organizationId)
    .in("type", ["held_allocate", "held_return"])
    .limit(10000)

  if (allAllocationsError) {
    console.error("[SET_MEMBER_BASELINE] Failed to fetch allocations", allAllocationsError.message)
    return { error: "Unable to calculate current baseline" }
  }

  const baselineByUser: Record<string, number> = {}
  for (const row of allAllocations || []) {
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

  const currentBaseline = baselineByUser[userId] ?? 0
  const delta = targetBaseline - currentBaseline

  // If no change needed, return early
  if (Math.abs(delta) < 0.01) {
    return { success: true }
  }

  // Determine transaction type based on delta
  const transactionType = delta > 0 ? "held_allocate" : "held_return"
  const transactionAmount = Math.abs(delta)

  // Compute cash on hand using the DB aggregate RPC (fallback to bounded scan if RPC unavailable)
  let totalIncome = 0
  let totalExpensesBusiness = 0
  let totalRefundWithdrawals = 0

  const { data: totalsRpcData, error: totalsRpcError } = await admin.rpc(
    "get_organization_financial_totals",
    { p_org_id: organizationId }
  )
  const rpcRow = (Array.isArray(totalsRpcData) ? totalsRpcData[0] : totalsRpcData) as
    | Record<string, unknown>
    | undefined

  if (rpcRow && !totalsRpcError) {
    totalIncome = Number(rpcRow.total_income ?? 0)
    totalExpensesBusiness = Number(rpcRow.total_expenses_business ?? 0)
    totalRefundWithdrawals = Number(rpcRow.total_refund_withdrawals ?? 0)
  } else {
    const { data: txRows, error: txError } = await admin
      .from("transactions")
      .select("type, amount, category")
      .eq("organization_id", organizationId)
      .in("type", ["income", "expense_business", "held_return"])
      .limit(10000)

    if (txError) {
      console.error("[SET_MEMBER_BASELINE] Failed to fetch transactions", txError.message)
      return { error: "Unable to validate allocation limit" }
    }

    for (const r of txRows || []) {
      const amount = Number(r.amount ?? 0)
      if (r.type === "income") totalIncome += amount
      if (r.type === "expense_business") totalExpensesBusiness += amount
      if (r.type === "held_return" && (r.category || "").toLowerCase() === "refund") {
        totalRefundWithdrawals += amount
      }
    }
  }
  const cashOnHand = totalIncome - totalExpensesBusiness - totalRefundWithdrawals

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

  revalidateOrganizationSections(organizationId, ['settings', 'settings/holdings', 'records'])

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

  const normalizedAmount = normalizeTransactionAmount(amount)
  if (normalizedAmount === null) {
    return { error: "Amount cannot be 0" }
  }

  const auth = await authorizeOrgAction(
    organizationId,
    ['owner', 'admin'],
    "You don't have permission to create refunds"
  )

  if ('error' in auth) {
    return auth
  }

  const { user } = auth
  const admin = createAdminClient()

  // Atomic stored procedure execution with row-level locks (AGENTS.md Rule 5)
  const { data, error } = await admin.rpc('process_member_refund', {
    p_org_id: organizationId,
    p_user_id: user.id,
    p_amount: normalizedAmount,
    p_description: description?.trim() || null,
  })

  if (error) {
    console.error("[CREATE_REFUND] Stored procedure error:", error.message)
    return { error: error.message || "Unable to process refund" }
  }

  const result = data as {
    success?: boolean
    error?: string
  } | null
  if (!result || !result.success) {
    return { error: result?.error || "Unable to process refund" }
  }

  revalidateOrganizationSections(organizationId, ['records', 'settings', 'settings/holdings'])

  return { success: true }
}
