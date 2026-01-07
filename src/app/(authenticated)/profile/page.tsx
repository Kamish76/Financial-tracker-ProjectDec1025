import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
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
          <h1 className="text-3xl font-semibold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-accent p-3">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your personal account details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base text-foreground">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="text-base text-foreground font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                <p className="text-base text-foreground">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CardTitle className="mb-2">More settings coming soon</CardTitle>
              <CardDescription className="text-center max-w-md">
                Additional profile customization and account settings will be available here.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
