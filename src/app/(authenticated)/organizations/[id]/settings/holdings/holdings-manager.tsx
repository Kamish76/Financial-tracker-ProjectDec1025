"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setMemberBaseline } from "../../actions"
import { useRouter } from "next/navigation"

interface Member {
  user_id: string
  email: string | null
  role: string
  businessHeld: number
  baseline: number
}

interface HoldingsManagerProps {
  organizationId: string
  members: Member[]
  cashOnHand: number
  totalAllocated: number
}

export function HoldingsManager({ organizationId, members, cashOnHand, totalAllocated }: HoldingsManagerProps) {
  const router = useRouter()
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unallocated = cashOnHand - totalAllocated

  const handleSetBaseline = async (userId: string) => {
    const valueStr = editValues[userId]
    if (valueStr === undefined || valueStr === "") return

    const targetBaseline = parseFloat(valueStr)
    if (isNaN(targetBaseline) || targetBaseline < 0) {
      setError("Please enter a valid non-negative number")
      return
    }

    setLoading(userId)
    setError(null)

    const result = await setMemberBaseline({
      organizationId,
      userId,
      targetBaseline,
    })

    setLoading(null)

    if (result.error) {
      setError(result.error)
    } else {
      // Clear edit value after success
      setEditValues((prev) => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cash on Hand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${cashOnHand.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total available from income − business expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAllocated.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sum of all baseline allocations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unallocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${unallocated.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Remaining available to allocate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      {/* Members Allocation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Member Allocations</CardTitle>
          <CardDescription>
            Set baseline business held for each member. Their total business held = baseline + ongoing income − ongoing expenses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {member.email || member.user_id}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Role: {member.role}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Current Business Held: <span className="font-medium">${member.businessHeld.toFixed(2)}</span>
                    {member.baseline > 0 && (
                      <span className="text-xs ml-2">
                        (Baseline: ${member.baseline.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <div className="w-32">
                    <Label htmlFor={`baseline-${member.user_id}`} className="text-xs">
                      New Baseline
                    </Label>
                    <Input
                      id={`baseline-${member.user_id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={member.baseline.toFixed(2)}
                      value={editValues[member.user_id] ?? ""}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [member.user_id]: e.target.value,
                        }))
                      }
                      disabled={loading !== null}
                    />
                  </div>
                  <Button
                    onClick={() => handleSetBaseline(member.user_id)}
                    disabled={
                      loading !== null ||
                      editValues[member.user_id] === undefined ||
                      editValues[member.user_id] === ""
                    }
                    size="sm"
                  >
                    {loading === member.user_id ? "Setting..." : "Set"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Back to Settings */}
      <div className="flex justify-start">
        <Button
          variant="outline"
          onClick={() => router.push(`/organizations/${organizationId}/settings`)}
        >
          Back to Settings
        </Button>
      </div>
    </div>
  )
}
