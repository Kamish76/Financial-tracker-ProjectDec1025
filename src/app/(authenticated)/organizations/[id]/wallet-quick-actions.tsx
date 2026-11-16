import Link from 'next/link'
import { ArrowLeftRight, ScrollText, Settings, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function WalletQuickActions({ organizationId }: { organizationId: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Jump directly to your sub accounts, transaction history, or wallet settings.
            </CardDescription>
          </div>
          <div className="rounded-full bg-accent-strong text-white p-2">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row flex-wrap gap-2.5">
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/organizations/${organizationId}/accounts`}>
            <Wallet className="h-4 w-4 mr-2" />
            Manage Sub Accounts
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/organizations/${organizationId}/records`}>
            <ScrollText className="h-4 w-4 mr-2" />
            Transaction History
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/organizations/${organizationId}/settings`}>
            <Settings className="h-4 w-4 mr-2" />
            Wallet Settings
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
