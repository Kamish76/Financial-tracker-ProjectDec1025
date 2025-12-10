import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Building2, Users, Crown, Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

// Helper to get role badge
function RoleBadge({ role }: { role: string }) {
  const config = {
    owner: { icon: Crown, label: 'Owner', className: 'bg-amber-100 text-amber-700' },
    admin: { icon: Shield, label: 'Admin', className: 'bg-blue-100 text-blue-700' },
    member: { icon: User, label: 'Member', className: 'bg-gray-100 text-gray-700' },
  }[role] || { icon: User, label: role, className: 'bg-gray-100 text-gray-700' }

  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

export default async function OrganizationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Fetch user's organizations through organization_members
  // Using admin client to bypass RLS issues
  const adminClient = createAdminClient()
  
  const { data: memberships, error } = await adminClient
    .from('organization_members')
    .select(`
      role,
      organization_id,
      organizations (
        id,
        name,
        description,
        created_at
      )
    `)
    .eq('user_id', user.id)

  if (error) {
    console.error('[ORGS_PAGE] Failed to fetch organizations:', error.message)
  }

  // Transform the data and get member counts
  const organizations = await Promise.all(
    (memberships || [])
      .filter((m) => m.organizations) // Filter out any null organizations
      .map(async (m) => {
        // Supabase returns single object for singular relation name
        const org = m.organizations as unknown as { id: string; name: string; description: string | null; created_at: string }
        
        // Get member count for this organization
        const { count } = await adminClient
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)

        return {
          id: org.id,
          name: org.name,
          description: org.description,
          created_at: org.created_at,
          role: m.role,
          member_count: count || 0,
        }
      })
  )

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
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/organizations/join">
                <Plus className="mr-2 h-4 w-4" />
                Join Organization
              </Link>
            </Button>
            <Button asChild>
              <Link href="/organizations/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Link>
            </Button>
          </div>
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
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-accent p-2">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <CardDescription className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {org.member_count} {org.member_count === 1 ? 'member' : 'members'}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <RoleBadge role={org.role} />
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
