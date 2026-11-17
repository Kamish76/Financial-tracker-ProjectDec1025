'use client'

import { useState } from 'react'
import { PlusCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { OrgTransactionModal } from './org-transaction-modal'

type AddIncomeSheetProps = {
  organizationId: string
  organizationDescription?: string | null
  currency?: string
}

export function AddIncomeSheet({
  organizationId,
  organizationDescription,
  currency,
}: AddIncomeSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        className="w-full justify-start gap-2"
        data-intent="add-income"
        aria-label="Open add income modal"
        onClick={() => setOpen(true)}
      >
        <PlusCircle className="h-4 w-4" />
        Add income
      </Button>

      <OrgTransactionModal
        isOpen={open}
        onClose={() => setOpen(false)}
        organizationId={organizationId}
        organizationDescription={organizationDescription}
        currency={currency}
        initialTab="income"
      />
    </>
  )
}
