import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6 text-muted-foreground">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Page Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-6 text-sm">
        The page you are looking for does not exist, has been removed, or is temporarily unavailable.
      </p>
      <Button asChild className="gap-2">
        <Link href="/organizations">
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  )
}
