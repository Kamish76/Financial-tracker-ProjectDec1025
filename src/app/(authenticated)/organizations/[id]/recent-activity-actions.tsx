'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getOrganizationCategoriesByType } from '@/lib/categories'
import type { CategoryItem } from '@/lib/category-constants'
import type { AccountWithBalance } from '@/lib/wallet-types'
import { deleteTransaction } from './records/actions'
import type { TransactionRecord as RecordsTransactionRecord } from './records/utils'
import { TransactionEditDialog } from './records/transaction-edit-dialog'
import { WalletTransactionEditDialog } from './records/wallet-transaction-edit-dialog'

type RecentActivityActionsProps = {
  organizationId: string
  isWallet: boolean
  currency?: string
  accounts?: AccountWithBalance[]
  transaction: {
    id: string
    type: string
    amount: number
    category: string | null
    description: string | null
    occurred_at: string | null
    created_at: string
    account_id?: string | null
    transfer_to_account_id?: string | null
  }
}

export function RecentActivityActions({
  organizationId,
  isWallet,
  currency,
  accounts = [],
  transaction,
}: RecentActivityActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!editOpen || !organizationId) return
    let isMounted = true
    getOrganizationCategoriesByType(organizationId)
      .then((res) => {
        if (!isMounted) return
        setCategories(transaction.type === 'income' ? res.income : res.expense)
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [editOpen, organizationId, transaction.type])

  const recordForDialog: RecordsTransactionRecord = {
    id: transaction.id,
    type: transaction.type as RecordsTransactionRecord['type'],
    amount: transaction.amount,
    category: transaction.category,
    category_id: null,
    description: transaction.description,
    occurred_at: transaction.occurred_at || transaction.created_at,
    created_at: transaction.created_at,
    updated_at: transaction.created_at,
    user_id: '',
    funded_by_type: null,
    funded_by_user_id: null,
    account_id: transaction.account_id ?? null,
    transfer_to_account_id: transaction.transfer_to_account_id ?? null,
  }

  const handleConfirmDelete = () => {
    setDeleteError(null)
    startTransition(async () => {
      const res = await deleteTransaction({
        organizationId,
        transactionId: transaction.id,
      })

      if (res && 'error' in res && res.error) {
        setDeleteError(res.error)
        return
      }

      setDeleteOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title="Edit transaction"
          aria-label="Edit transaction"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
          title="Delete transaction"
          aria-label="Delete transaction"
          onClick={() => {
            setDeleteError(null)
            setDeleteOpen(true)
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {isWallet ? (
        <WalletTransactionEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          transaction={recordForDialog}
          organizationId={organizationId}
          categories={categories}
          accounts={accounts}
          currency={currency}
          onSave={() => {
            setEditOpen(false)
            router.refresh()
          }}
        />
      ) : (
        <TransactionEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          transaction={recordForDialog}
          organizationId={organizationId}
          categories={categories}
          onSave={() => {
            setEditOpen(false)
            router.refresh()
          }}
        />
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
