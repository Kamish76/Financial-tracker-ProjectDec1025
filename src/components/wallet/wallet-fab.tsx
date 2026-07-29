'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import type { WalletAccount, AccountWithBalance } from '@/lib/wallet-accounts'
import { AddTransactionModal } from './add-transaction-modal'

type WalletFabProps = {
  organizationId: string
  accounts: (WalletAccount | AccountWithBalance)[]
}

export function WalletFab({ organizationId, accounts }: WalletFabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!accounts || accounts.length === 0) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2.5 px-6 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-sm tracking-wide shadow-2xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 border border-primary-foreground/20"
          title="Add Transaction"
        >
          <Plus className="h-5 w-5 stroke-[3]" />
          <span>Add Transaction</span>
        </button>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        organizationId={organizationId}
        accounts={accounts}
      />
    </>
  )
}
