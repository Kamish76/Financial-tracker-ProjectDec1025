/**
 * Lightweight route transition skeleton for authenticated pages.
 */
export function PageSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 rounded-md bg-muted/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-xl border bg-muted/50" />
        <div className="h-28 rounded-xl border bg-muted/50" />
        <div className="h-28 rounded-xl border bg-muted/50" />
      </div>
      <div className="h-64 rounded-xl border bg-muted/40" />
    </div>
  )
}
