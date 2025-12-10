import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Building2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function OrganizationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // TODO: Fetch user's organizations from database
  // For now, showing empty state
  const organizations: Array<{ id: string; name: string; description?: string; member_count?: number }> = []

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">My Organizations</h1>
            <p className="text-muted-foreground mt-1">
              Manage your financial organizations and workspaces
            </p>
          </div>
          <Button asChild>
            <Link href="/organizations/join">
              <Plus className="mr-2 h-4 w-4" />
              Join Organization
            </Link>
          </Button>
        </div>

        {organizations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Building2 className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardTitle className="mb-2">No organizations yet</CardTitle>
              <CardDescription className="text-center max-w-md mb-6">
                You&apos;re not part of any organizations. Join an existing organization or create a new one to get started with tracking finances.
              </CardDescription>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/organizations/join">
                    <Plus className="mr-2 h-4 w-4" />
                    Join Organization
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/organizations/create">
                    Create Organization
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <Card key={org.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-accent p-2">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Users className="h-3 w-3" />
                          {org.member_count || 0} members
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {org.description || 'No description'}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <Button size="sm" asChild className="flex-1">
                      <Link href={`/organizations/${org.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
