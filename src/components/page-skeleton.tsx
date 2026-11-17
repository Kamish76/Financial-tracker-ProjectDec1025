export function CardSkeleton({ heightClass = 'h-48' }: { heightClass?: string }) {
  return (
    <div
      className={`w-full rounded-xl border bg-muted/40 animate-pulse ${heightClass}`}
      aria-busy="true"
    />
  )
}

export function RecentActivitySkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-4 animate-pulse" aria-busy="true">
      <div className="space-y-2">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted/70" />
      </div>
      <div className="divide-y divide-border/70 rounded-xl border border-border/70">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-3 w-44 rounded bg-muted/70" />
            </div>
            <div className="h-5 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

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
