"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { OrganizationRecordsView } from "./organization-records-view"
import { WalletRecordsView } from "./wallet-records-view"
import { fetchWalletSummary } from "./actions"

type RecordsPageContentProps = {
  currency?: string
  isWallet?: boolean
  userRole?: string
}

export function RecordsPageContent({ currency, isWallet: initialIsWallet, userRole }: RecordsPageContentProps) {
  const params = useParams()
  const organizationId = params.id as string
  const [fetchedIsWallet, setFetchedIsWallet] = useState<boolean | undefined>(undefined)
  const isWallet = initialIsWallet ?? fetchedIsWallet

  useEffect(() => {
    if (initialIsWallet !== undefined) {
      return
    }

    let ignore = false
    void fetchWalletSummary(organizationId).then((res) => {
      if (!ignore) {
        setFetchedIsWallet(Boolean(res?.isWallet))
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

  return <OrganizationRecordsView currency={currency} userRole={userRole} />
}
