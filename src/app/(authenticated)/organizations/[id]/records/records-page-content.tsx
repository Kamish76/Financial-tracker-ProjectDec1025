"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { OrganizationRecordsView } from "./organization-records-view"
import { WalletRecordsView } from "./wallet-records-view"
import { fetchWalletSummary } from "./actions"

type RecordsPageContentProps = {
  currency?: string
  isWallet?: boolean
}

export function RecordsPageContent({ currency, isWallet: initialIsWallet }: RecordsPageContentProps) {
  const params = useParams()
  const organizationId = params.id as string
  const [isWallet, setIsWallet] = useState<boolean | undefined>(initialIsWallet)

  useEffect(() => {
    if (initialIsWallet !== undefined) {
      setIsWallet(initialIsWallet)
      return
    }

    let ignore = false
    void fetchWalletSummary(organizationId).then((res) => {
      if (!ignore) {
        setIsWallet(Boolean(res?.isWallet))
      }
    })

    return () => {
      ignore = true
    }
  }, [initialIsWallet, organizationId])

  if (isWallet === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 animate-pulse">Loading transaction records...</div>
      </div>
    )
  }

  if (isWallet) {
    return <WalletRecordsView currency={currency} />
  }

  return <OrganizationRecordsView currency={currency} />
}
