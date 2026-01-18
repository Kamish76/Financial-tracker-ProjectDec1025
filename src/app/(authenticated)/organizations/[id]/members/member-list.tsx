'use client'

import { useState } from 'react'
import { Users, UserMinus, UserPlus, Shield, Crown, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { MemberWithProfile, OrganizationRole } from '@/lib/types/member'
import { ROLE_INFO, getMemberDisplayName, formatJoinedDate, formatDeactivatedDate } from '@/lib/types/member'
import { MemberCard } from './member-card'
import { InviteCodeManager } from './invite-code-manager'

type MemberListProps = {
  organizationId: string
  currentUserId: string
  currentUserRole: OrganizationRole
  activeMembers: MemberWithProfile[]
  inactiveMembers: MemberWithProfile[]
}

export function MemberList({
  organizationId,
  currentUserId,
  currentUserRole,
  activeMembers: initialActiveMembers,
  inactiveMembers: initialInactiveMembers,
}: MemberListProps) {
  const [activeMembers, setActiveMembers] = useState(initialActiveMembers)
  const [inactiveMembers, setInactiveMembers] = useState(initialInactiveMembers)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<OrganizationRole | 'all'>('all')

  const canManage = ['owner', 'admin'].includes(currentUserRole)

  // Filter members based on search and role
  const filterMembers = (members: MemberWithProfile[]) => {
    return members.filter((member) => {
      const name = getMemberDisplayName(member).toLowerCase()
      const matchesSearch = name.includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'all' || member.role === roleFilter
      return matchesSearch && matchesRole
    })
  }

  const filteredActiveMembers = filterMembers(activeMembers)
  const filteredInactiveMembers = filterMembers(inactiveMembers)

  // Refresh member lists (called from child components)
  const refreshMembers = () => {
    // In a real implementation, we would refetch from the server
    // For now, we rely on Next.js revalidation
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Members Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Organization Members
              </CardTitle>
              <CardDescription>
                View and manage members of this organization
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search members by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={roleFilter}
                onValueChange={(value) => setRoleFilter(value as OrganizationRole | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs for Active/Inactive */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Active
                <Badge variant="secondary">{filteredActiveMembers.length}</Badge>
              </TabsTrigger>
              {canManage && (
                <TabsTrigger value="inactive" className="flex items-center gap-2">
                  <UserMinus className="h-4 w-4" />
                  Inactive
                  <Badge variant="secondary">{filteredInactiveMembers.length}</Badge>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Active Members */}
            <TabsContent value="active" className="mt-6">
              {filteredActiveMembers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active members found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActiveMembers.map((member) => (
                    <MemberCard
                      key={member.user_id}
                      member={member}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                      organizationId={organizationId}
                      isActive={true}
                      onRefresh={refreshMembers}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Inactive Members */}
            {canManage && (
              <TabsContent value="inactive" className="mt-6">
                {filteredInactiveMembers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserMinus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No inactive members</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredInactiveMembers.map((member) => (
                      <MemberCard
                        key={member.user_id}
                        member={member}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                        organizationId={organizationId}
                        isActive={false}
                        onRefresh={refreshMembers}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Invite Codes Section */}
      {canManage && (
        <InviteCodeManager organizationId={organizationId} />
      )}
    </div>
  )
}
