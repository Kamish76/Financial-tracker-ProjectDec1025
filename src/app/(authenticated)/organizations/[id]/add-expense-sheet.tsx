'use client'

import { useState } from 'react'
import { ReceiptText } from 'lucide-react'

import { isWalletOrganization } from '@/lib/wallet'
import { Button } from '@/components/ui/button'
import { OrgTransactionModal } from './org-transaction-modal'

type AddExpenseSheetProps = {
  organizationId: string
  organizationDescription?: string | null
  currency?: string
}

export function AddExpenseSheet({
  organizationId,
  organizationDescription,
  currency,
}: AddExpenseSheetProps) {
  const [open, setOpen] = useState(false)
  const isWallet = isWalletOrganization(organizationDescription)

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="w-full justify-start gap-2"
        data-intent="add-expense"
        aria-label="Open add expense modal"
        onClick={() => setOpen(true)}
      >
        <ReceiptText className="h-4 w-4" />
        {isWallet ? 'Add wallet expense' : 'Add expense'}
      </Button>

      <OrgTransactionModal
        isOpen={open}
        onClose={() => setOpen(false)}
        organizationId={organizationId}
        organizationDescription={organizationDescription}
        currency={currency}
        initialTab="expense"
      />
    </>
  )
}
