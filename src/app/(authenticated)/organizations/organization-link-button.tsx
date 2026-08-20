'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface OrganizationLinkButtonProps {
  orgId: string
  label?: string
}

export function OrganizationLinkButton({ orgId, label = 'View Details' }: OrganizationLinkButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    setIsLoading(true)
    router.push(`/organizations/${orgId}`)
  }

  return (
    <Button 
      size="sm" 
      className="flex-1" 
      onClick={handleClick} 
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        label
      )}
    </Button>
  )
}
