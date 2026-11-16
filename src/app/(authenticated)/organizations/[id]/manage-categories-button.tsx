'use client'

import { useState } from 'react'
import { Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ManageCategoriesDialog } from './settings/manage-categories-dialog'

export function ManageCategoriesButton({
  organizationId,
  disabled = false,
}: {
  organizationId: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start gap-2"
        disabled={disabled}
        aria-label="Manage categories"
        onClick={() => setOpen(true)}
      >
        <Tag className="h-4 w-4" />
        Manage Categories
      </Button>

      {!disabled && (
        <ManageCategoriesDialog
          open={open}
          onOpenChange={setOpen}
          organizationId={organizationId}
        />
      )}
    </>
  )
}
