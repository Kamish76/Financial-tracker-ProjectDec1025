'use client'

import Link from 'next/link'
import { ShieldCheck, Menu, X, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

const navigationLinks = [
  { label: 'Workspace Modes', href: '#modes' },
  { label: 'Features', href: '#features' },
  { label: 'Privacy', href: '/privacy' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="inline-flex items-center gap-2.5 rounded-xl border border-border/80 bg-card/80 px-3 py-1.5 shadow-2xs group-hover:border-accent/50 transition-colors">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-accent-strong">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </div>
              <span className="font-semibold tracking-tight text-foreground text-sm">
                OrgFinance
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2.5 ml-auto md:ml-0">
            <ThemeToggle />

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth">Sign in</Link>
              </Button>
              <Button size="sm" className="gap-1.5 shadow-xs" asChild>
                <Link href="/auth">
                  Get started
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/70 py-4 space-y-2">
            {navigationLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border/50 grid gap-2">
              <Button variant="ghost" size="sm" className="w-full justify-center" asChild>
                <Link href="/auth">Sign in</Link>
              </Button>
              <Button size="sm" className="w-full justify-center gap-1.5" asChild>
                <Link href="/auth">
                  Get started
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

