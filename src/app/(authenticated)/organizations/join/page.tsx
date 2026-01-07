'use client'

import { useState } from 'react'
import { Search, Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { searchOrganizations } from './actions'

interface SearchResult {
  id: string
  name: string
  description?: string
}

export default function JoinOrganizationPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      const result = await searchOrganizations(searchQuery)
      
      if (result.error) {
        setError(result.error)
        setSearchResults([])
      } else {
        setSearchResults(result.data)
      }
    } catch (err) {
      setError('Failed to search organizations')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleJoinOrganization = async (orgId: string) => {
    // TODO: Implement join organization API call
    console.log('Joining organization:', orgId)
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/organizations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold text-foreground">Join an Organization</h1>
          <p className="text-muted-foreground mt-1">
            Search for and join existing financial organizations
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Organizations</CardTitle>
            <CardDescription>
              Enter an organization name, code, or keyword to find organizations you can join
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Organization Name or Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    placeholder="e.g., Acme Corp, ORG-12345"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch()
                    }}
                  />
                  <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                    <Search className="mr-2 h-4 w-4" />
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {searchResults.length === 0 && searchQuery && !isSearching ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Building2 className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardTitle className="mb-2">No organizations found</CardTitle>
              <CardDescription className="text-center max-w-md">
                We couldn&apos;t find any organizations matching &quot;{searchQuery}&quot;. Try a different search term or ask your organization admin for the correct code.
              </CardDescription>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-dashed border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CardTitle className="mb-2 text-red-900">Search Error</CardTitle>
              <CardDescription className="text-center max-w-md text-red-700">
                {error}
              </CardDescription>
            </CardContent>
          </Card>
        ) : searchResults.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Search Results</h2>
            <div className="grid gap-4">
              {searchResults.map((org) => (
                <Card key={org.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-accent p-2">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{org.name}</CardTitle>
                        </div>
                      </div>
                      <Button onClick={() => handleJoinOrganization(org.id)}>
                        Join
                      </Button>
                    </div>
                  </CardHeader>
                  {org.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{org.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardTitle className="mb-2">Start your search</CardTitle>
              <CardDescription className="text-center max-w-md">
                Enter an organization name or code above to search for organizations you can join.
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
