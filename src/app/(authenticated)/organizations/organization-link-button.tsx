'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface OrganizationLinkButtonProps {
  orgId: string
  label?: string
}

export function OrganizationLinkButton({ orgId, label = 'View Details' }: OrganizationLinkButtonProps) {
  return (
    <Button asChild size="sm" className="flex-1">
      <Link href={`/organizations/${orgId}`}>
        {label}
      </Link>
    </Button>
  )
}
