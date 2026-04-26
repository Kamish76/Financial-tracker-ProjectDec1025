import { revalidatePath } from 'next/cache'

export type OrganizationSection = 'records' | 'settings' | 'members' | 'settings/holdings'

export function revalidateOrganizationOverview(organizationId: string) {
  revalidatePath(`/organizations/${organizationId}`)
}

export function revalidateOrganizationRecords(organizationId: string) {
  revalidateOrganizationOverview(organizationId)
  revalidatePath(`/organizations/${organizationId}/records`)
}

export function revalidateOrganizationMembers(organizationId: string) {
  revalidateOrganizationOverview(organizationId)
  revalidatePath(`/organizations/${organizationId}/members`)
}

export function revalidateOrganizationSections(
  organizationId: string,
  sections: OrganizationSection[]
) {
  revalidateOrganizationOverview(organizationId)

  for (const section of sections) {
    revalidatePath(`/organizations/${organizationId}/${section}`)
  }
}