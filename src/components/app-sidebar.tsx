'use client'

import Link from 'next/link'
import { Building2, User, LogOut, Settings, Moon, Sun, WalletCards } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useState, useEffect } from 'react'

export function AppSidebar({ walletId }: { walletId?: string | null } = {}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const walletUrl = walletId
    ? `/organizations/${walletId}`
    : '/organizations/create?mode=wallet'

  const navigationItems = [
    {
      title: 'Organizations',
      url: '/organizations',
      icon: Building2,
    },
    {
      title: 'Personal Wallet',
      url: walletUrl,
      icon: WalletCards,
    },
    {
      title: 'Profile',
      url: '/profile',
      icon: User,
    },
  ]

  const isWalletActive = walletId
    ? pathname === `/organizations/${walletId}` ||
      pathname.startsWith(`/organizations/${walletId}/`)
    : pathname === '/organizations/create' &&
      searchParams?.get('mode') === 'wallet'

  const isItemActive = (itemTitle: string, itemUrl: string) => {
    if (itemTitle === 'Personal Wallet') {
      return isWalletActive
    }
    if (itemTitle === 'Organizations') {
      if (isWalletActive) {
        return false
      }
      return pathname === '/organizations' || pathname.startsWith('/organizations/')
    }
    return pathname === itemUrl || pathname.startsWith(`${itemUrl}/`)
  }

  useEffect(() => {
    const stored = window.localStorage.getItem('orgfinance-theme') as 'light' | 'dark' | null
    const current = document.documentElement.dataset.theme as 'light' | 'dark' | undefined
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme =
      stored === 'light' || stored === 'dark'
        ? stored
        : current === 'light' || current === 'dark'
        ? current
        : prefersDark
        ? 'dark'
        : 'light'
    requestAnimationFrame(() => {
      setTheme(initialTheme)
      document.documentElement.dataset.theme = initialTheme
    })
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    applyTheme(newTheme)
    window.localStorage.setItem('orgfinance-theme', newTheme)
    setTheme(newTheme)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/organizations">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-accent text-white">
                  <Building2 className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">OrgFinance</span>
                  <span className="text-xs text-muted-foreground">Tracker</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = isItemActive(item.title, item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleThemeToggle} className="w-full cursor-pointer">
                    {theme === 'dark' ? <Sun /> : <Moon />}
                  <span>Theme</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="w-full cursor-pointer">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
