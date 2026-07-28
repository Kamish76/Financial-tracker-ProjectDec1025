'use client'

import { useState, useTransition } from 'react'
import { Archive, ArchiveRestore, Trash2, Wallet, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  AccountWithBalance,
  deleteWalletAccount,
  toggleArchiveWalletAccount,
} from '@/lib/wallet-accounts'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateAccountSheet } from './create-account-sheet'
import { EditAccountSheet } from './edit-account-sheet'

type AccountsClientProps = {
  organizationId: string
  accounts: AccountWithBalance[]
}

export function AccountsClient({ organizationId, accounts }: AccountsClientProps) {
  const router = useRouter()
  const [showArchived, setShowArchived] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeAccounts = accounts.filter((a) => a.is_active)
  const archivedAccounts = accounts.filter((a) => !a.is_active)

  const displayedAccounts = showArchived ? accounts : activeAccounts

  const totalBalance = activeAccounts.reduce((sum, a) => sum + a.current_balance, 0)

  const handleToggleArchive = (accountId: string, currentStatus: boolean) => {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await toggleArchiveWalletAccount(accountId, !currentStatus)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleDelete = (accountId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${name}" account?`)) {
      return
    }
    setErrorMsg(null)
    startTransition(async () => {
      const res = await deleteWalletAccount(accountId)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sub Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal wallet accounts, cash balances, and bank accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {archivedAccounts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? 'Hide Archived' : `Show Archived (${archivedAccounts.length})`}
            </Button>
          )}
          <CreateAccountSheet organizationId={organizationId} />
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary Card */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Active Accounts</CardDescription>
            <CardTitle className="text-3xl">{activeAccounts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {archivedAccounts.length} archived account(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Combined Total Balance</CardDescription>
            <CardTitle className="text-3xl">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Across all active accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      {displayedAccounts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold">No accounts found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You don&apos;t have any active sub accounts yet. Create one to start tracking.
          </p>
          <CreateAccountSheet organizationId={organizationId} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedAccounts.map((acc) => (
            <Card
              key={acc.id}
              className={`flex flex-col justify-between ${
                !acc.is_active ? 'opacity-60 bg-muted/30' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {acc.name}
                      {!acc.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Archived
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {acc.transaction_count} transaction{acc.transaction_count === 1 ? '' : 's'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <EditAccountSheet account={acc} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleArchive(acc.id, acc.is_active)}
                      disabled={isPending}
                      title={acc.is_active ? 'Archive account' : 'Restore account'}
                      aria-label={acc.is_active ? 'Archive account' : 'Restore account'}
                    >
                      {acc.is_active ? (
                        <Archive className="h-4 w-4" />
                      ) : (
                        <ArchiveRestore className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(acc.id, acc.name)}
                      disabled={isPending}
                      title="Delete account"
                      aria-label="Delete account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-baseline justify-between border-t pt-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Current Balance
                  </span>
                  <span className="text-2xl font-bold">
                    ${acc.current_balance.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>Starting Value:</span>
                  <span>
                    ${acc.starting_value.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
