import { Loader2 } from "lucide-react"

export default function OrganizationLoading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading workspace...</p>
    </div>
  )
}
