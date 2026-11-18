'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { MirrorWalletContext } from '@/lib/wallet-types'
import { OrgTransactionModal } from './org-transaction-modal'

type RefundSheetProps = {
  organizationId: string
  currency?: string
  mirrorContext?: MirrorWalletContext | null
}

export function RefundSheet({ organizationId, currency, mirrorContext }: RefundSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start gap-2"
        data-intent="refund"
        aria-label="Open refund modal"
        onClick={() => setOpen(true)}
      >
        <RefreshCw className="h-4 w-4" />
        Refund
      </Button>

      <OrgTransactionModal
        isOpen={open}
        onClose={() => setOpen(false)}
        organizationId={organizationId}
        currency={currency}
        initialTab="refund"
        mirrorContext={mirrorContext}
      />
    </>
  )
}
