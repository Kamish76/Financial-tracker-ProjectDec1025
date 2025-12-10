import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Settings as SettingsIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your application preferences
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-6 mb-4">
              <SettingsIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="mb-2">Settings coming soon</CardTitle>
            <CardDescription className="text-center max-w-md">
              Application settings and preferences will be available here.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
