'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  Database,
  Users,
  CheckCircle2,
  Printer,
  Mail,
  Calendar,
  Wallet,
  Server,
  AlertCircle,
  ArrowRight,
  KeyRound,
  History,
  Check,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SectionItem {
  id: string
  title: string
  icon: React.ElementType
  category: 'all' | 'business' | 'wallet' | 'rights'
}

const tableOfContents: SectionItem[] = [
  { id: 'collection', title: '1. Information We Collect', icon: Database, category: 'all' },
  { id: 'usage', title: '2. How We Use Your Data', icon: Eye, category: 'all' },
  { id: 'isolation', title: '3. Multi-Tenant Isolation & Wallet Mode', icon: Users, category: 'business' },
  { id: 'wallet-mode', title: '4. Personal Wallet Mode Privacy', icon: Wallet, category: 'wallet' },
  { id: 'archiving', title: '5. Data Archiving & Financial Audit Trails', icon: History, category: 'business' },
  { id: 'security', title: '6. Security & Authorization Guards', icon: Lock, category: 'all' },
  { id: 'sharing', title: '7. Data Sharing & Processors', icon: Share2, category: 'all' },
  { id: 'rights', title: '8. Your Rights & Choices', icon: KeyRound, category: 'rights' },
  { id: 'cookies', title: '9. Cookies & Local Storage', icon: Server, category: 'all' },
  { id: 'contact', title: '10. Contact Information', icon: Mail, category: 'all' },
]

export function PrivacyPolicyContent() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'business' | 'wallet' | 'rights'>('all')
  const [acknowledged, setAcknowledged] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('collection')

  const handlePrint = () => {
    window.print()
  }

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const filteredSections = tableOfContents.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory || item.category === 'all'
  )

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-8 sm:p-12 shadow-sm">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Legal & Compliance
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                Privacy Policy
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                We believe financial tracking should be transparent, secure, and respectful of your data. 
                Learn how OrgFinance protects multi-tenant organizations, member balances, and personal wallets.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-accent" />
                  Last Updated: July 31, 2026
                </Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1 font-medium">
                  <Lock className="h-3.5 w-3.5 text-accent" />
                  End-to-End RLS Encrypted
                </Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  GDPR & CCPA Compliant
                </Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2 border-border/70 bg-background/50 hover:bg-background"
              >
                <Printer className="h-4 w-4" />
                Print Policy
              </Button>
              <Button size="sm" asChild className="gap-2">
                <Link href="/auth">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="border-border/70 bg-card/50 hover:bg-card/80 transition-all shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  Multi-Tenant
                </Badge>
                <Users className="h-5 w-5 text-accent" />
              </div>
              <CardTitle className="text-lg pt-2">Strict Tenant Isolation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every organization uses strict server-side membership guards and Row-Level Security (RLS). Users can only access workspaces where they are active members.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/50 hover:bg-card/80 transition-all shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  Audit Trails
                </Badge>
                <History className="h-5 w-5 text-accent" />
              </div>
              <CardTitle className="text-lg pt-2">Archiving Over Deletion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To safeguard financial accountability, sub-accounts with recorded transactions are archived rather than hard-deleted, preventing accidental historical data loss.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/50 hover:bg-card/80 transition-all shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  Zero Ad Selling
                </Badge>
                <Lock className="h-5 w-5 text-accent" />
              </div>
              <CardTitle className="text-lg pt-2">Private Wallet Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                In Personal Wallet Mode (<code className="text-xs bg-muted px-1.5 py-0.5 rounded">is_wallet = true</code>), multi-user sharing is disabled. Your personal accounts stay 100% private to you.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs for Quick Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Filter Perspective:</span>
            <div className="inline-flex rounded-lg border border-border/70 bg-muted/40 p-1 text-xs">
              {(
                [
                  { id: 'all', label: 'All Sections' },
                  { id: 'business', label: 'Organizations & Teams' },
                  { id: 'wallet', label: 'Personal Wallet' },
                  { id: 'rights', label: 'Your Rights' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                    activeCategory === tab.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            Showing {filteredSections.length} of {tableOfContents.length} sections
          </span>
        </div>

        {/* Main Content Area with Sticky TOC */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Table of Contents - Sidebar */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Table of Contents
                </span>
                <FileText className="h-4 w-4 text-accent" />
              </div>
              <nav className="space-y-1">
                {filteredSections.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-accent/15 text-foreground border-l-2 border-accent'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-accent" />
                      <span className="truncate">{item.title}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Support Callout */}
            <div className="rounded-2xl border border-border/70 bg-card/40 p-5 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                <Mail className="h-4 w-4 text-accent" />
                Questions about privacy?
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our Data Protection Officer is available to assist with data export requests and inquiries.
              </p>
              <a
                href="mailto:hello@orgfinance.com?subject=Privacy%20Policy%20Inquiry"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
              >
                Contact Data Protection Officer
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </aside>

          {/* Policy Text - Main Content */}
          <main className="lg:col-span-3 space-y-10">
            {/* 1. Information We Collect */}
            <section
              id="collection"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-card/40 p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="rounded-xl bg-accent/15 p-2.5">
                  <Database className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">1. Information We Collect</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    What data we process to run multi-tenant workspaces and wallets
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  OrgFinance collects information required to provide financial tracking, team accountability, and personal ledger management. The data we collect depends on whether you use our multi-tenant business features or Personal Wallet Mode:
                </p>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="rounded-xl border border-border/70 bg-background/60 p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-accent" />
                      Account & Identity Data
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      We collect your email address, authentication provider identifiers, name, and profile avatars managed securely through Supabase Authentication.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-background/60 p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-accent" />
                      Financial & Ledger Data
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Organization names, member balances, financial transactions (income, operational expenses, member contributions), budgets, categories, and sub-accounts.
                    </p>
                  </div>
                </div>

                <ul className="list-disc pl-5 space-y-2 pt-2">
                  <li>
                    <strong className="text-foreground">Workspace Membership Information:</strong> Your assigned roles (owner, admin, member) and active status within organizations (<code className="text-xs bg-muted px-1.5 py-0.5 rounded">organization_members</code>).
                  </li>
                  <li>
                    <strong className="text-foreground">Technical & Usage Metadata:</strong> Browser type, timestamp of actions, and theme preferences stored locally (<code className="text-xs bg-muted px-1.5 py-0.5 rounded">localStorage</code>) to render your desired appearance.
                  </li>
                </ul>
              </div>
            </section>

            {/* 2. How We Use Your Data */}
            <section
              id="usage"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-card/40 p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="rounded-xl bg-accent/15 p-2.5">
                  <Eye className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">2. How We Use Your Data</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Our lawful basis and core purposes for data processing
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  We use the information we collect exclusively to operate, maintain, and enhance OrgFinance. We do <strong className="text-foreground">not</strong> use your financial transactions for advertising or profiling.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-accent/15 p-1 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <div>
                      <strong className="text-foreground">Multi-Tenant Financial Calculation:</strong> Calculating real-time organization cash on hand, member contributions versus operational expenses, and member balances.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-accent/15 p-1 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <div>
                      <strong className="text-foreground">Access Authorization:</strong> Verifying user access to protected pages, route handlers, and server actions using strict organization membership guards.
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-accent/15 p-1 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <div>
                      <strong className="text-foreground">Platform Security & Audit:</strong> Detecting fraud, preventing unauthorized data queries, and maintaining audit trails for organizational accountability.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Multi-Tenant Isolation & Wallet Mode */}
            <section
              id="isolation"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-card/40 p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="rounded-xl bg-accent/15 p-2.5">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    3. Multi-Tenant Isolation & Role Guards
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    How data is segregated between student groups and business workspaces
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  OrgFinance is architected around <strong className="text-foreground">multi-tenant isolation</strong>. When you create or join an organization, your financial data is scoped to that tenant ID:
                </p>

                <div className="rounded-xl border border-border/80 bg-background/80 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <ShieldCheck className="h-5 w-5 text-accent" />
                    Server-Side Guard Verification Pattern
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    To prevent unauthorized data exposure, all Next.js page and route handler requests undergo verification via <code className="bg-muted px-1.5 py-0.5 rounded">requireOrgMembership(id)</code>. This ensures that users who lack an active row in <code className="bg-muted px-1.5 py-0.5 rounded">organization_members</code> cannot view or query another organization&apos;s financial records.
                  </p>
                </div>

                <p>
                  Organization owners and administrators have permission to invite members and view member contribution balances. Regular members can only view data permitted by their organizational role.
                </p>
              </div>
            </section>

            {/* 4. Personal Wallet Mode Privacy */}
            <section
              id="wallet-mode"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-card/40 p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="rounded-xl bg-accent/15 p-2.5">
                  <Wallet className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    4. Personal Wallet Mode Privacy
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Dedicated conventions for single-user personal finance (<code className="text-xs">is_wallet = true</code>)
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  When you create a workspace configured as a <strong className="text-foreground">Personal Wallet</strong> (<code className="text-xs bg-muted px-1.5 py-0.5 rounded">is_wallet = true</code>), OrgFinance applies strict single-user privacy conventions:
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">UI & Feature Isolation</h3>
                    <p className="text-xs text-muted-foreground">
                      Multi-user business features (such as Member Balances and Quick Team Actions) are hidden. Your wallet sub-accounts and transactions remain visible only to you.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm">Default Cash Sub-Account</h3>
                    <p className="text-xs text-muted-foreground">
                      When creating a Personal Wallet, OrgFinance automatically spawns a default <code className="text-xs bg-muted px-1 py-0.5 rounded">&apos;Cash&apos;</code> sub-account with starting value $0. This ledger is private to your user ID.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Data Archiving & Financial Audit Trails */}
            <section
              id="archiving"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-card/40 p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="rounded-xl bg-accent/15 p-2.5">
                  <History className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    5. Data Archiving & Financial Accountability
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Why we use soft-archiving to protect transaction integrity
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  In financial tracking, accidental deletion of accounts can corrupt accounting history and member contribution balances. To protect your financial audit trails, OrgFinance enforces the following safeguard:
                </p>

                <div className="rounded-xl border-l-4 border-l-accent border border-border/70 bg-background/60 p-5 space-y-2">
                  <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-accent" />
                    Account Deletion Safeguard
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We never hard-delete a sub-account if it is referenced by any existing transactions. Instead, users archive the account (<code className="bg-muted px-1 py-0.5 rounded">is_active = false</code>). This ensures historical transaction balances and reports remain accurate while removing the account from active selectors.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Security & Authorization Guards */}
            <section
              id="security"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-card/40 p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="rounded-xl bg-accent/15 p-2.5">
                  <Lock className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    6. Data Security & Storage
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    How we encrypt and protect your records
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  We implement industry-standard security measures to prevent unauthorized access, alteration, or disclosure of your financial data:
                </p>

                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-foreground">Row-Level Security (RLS):</strong> All Supabase database tables enforce RLS policies, ensuring that queries are scoped strictly to authenticated organization members.
                  </li>
                  <li>
                    <strong className="text-foreground">Encryption in Transit & at Rest:</strong> All traffic between your browser and our servers is encrypted using modern TLS/SSL protocols. Database volumes are encrypted at rest.
                  </li>
                  <li>
                    <strong className="text-foreground">No Direct Unshielded Queries:</strong> We avoid brittle <code className="text-xs bg-muted px-1 py-0.5 rounded">.single()</code> database queries that could fail or expose improper error states, using resilient server-side guard patterns instead.
                  </li>
                </ul>
              </div>
            </section>

            {/* 7. Data Sharing & Processors */}
            <section
              id="sharing"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-card/40 p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="rounded-xl bg-accent/15 p-2.5">
                  <Share2 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    7. Data Sharing & Third-Party Processors
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    When and why data is shared with infrastructure providers
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  We do not sell, rent, or trade your personal information. We only share data in the following limited circumstances:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-foreground">Cloud & Auth Infrastructure:</strong> We use Supabase and Vercel to host database services, process authentication tokens, and serve application pages under strict confidentiality agreements.
                  </li>
                  <li>
                    <strong className="text-foreground">Legal Requirements:</strong> We may disclose information if required by law, subpoena, or to protect the safety and rights of OrgFinance users.
                  </li>
                </ul>
              </div>
            </section>

            {/* 8. Your Rights & Choices */}
            <section
              id="rights"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-card/40 p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="rounded-xl bg-accent/15 p-2.5">
                  <KeyRound className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    8. Your Rights & Data Choices
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Your control over your personal and financial information
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Depending on your jurisdiction (including GDPR in Europe and CCPA in California), you have the right to:
                </p>

                <div className="grid gap-3 sm:grid-cols-2 pt-1">
                  <div className="rounded-lg border border-border/70 bg-background/50 p-3.5 space-y-1">
                    <div className="font-semibold text-foreground text-sm">Access & Export</div>
                    <p className="text-xs text-muted-foreground">
                      Request an export of your transaction history and organization contributions.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-background/50 p-3.5 space-y-1">
                    <div className="font-semibold text-foreground text-sm">Correction</div>
                    <p className="text-xs text-muted-foreground">
                      Update your user profile or adjust incorrect transaction entries within your organization.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-background/50 p-3.5 space-y-1">
                    <div className="font-semibold text-foreground text-sm">Deletion Request</div>
                    <p className="text-xs text-muted-foreground">
                      Request deletion of your account. Note that shared organization ledgers may retain archived records.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-background/50 p-3.5 space-y-1">
                    <div className="font-semibold text-foreground text-sm">Role Revocation</div>
                    <p className="text-xs text-muted-foreground">
                      Organization owners can remove your membership at any time, revoking access immediately.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 9. Cookies & Local Storage */}
            <section
              id="cookies"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-card/40 p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="rounded-xl bg-accent/15 p-2.5">
                  <Server className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    9. Cookies & Local Storage
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    How we use browser storage for theme and authentication
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  OrgFinance uses minimal browser storage to deliver a seamless experience:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-foreground">Authentication Cookies:</strong> Secure, HTTP-only cookies managed by Supabase SSR to keep you logged in across sessions.
                  </li>
                  <li>
                    <strong className="text-foreground">Theme Preference (<code className="text-xs bg-muted px-1.5 py-0.5 rounded">orgfinance-theme</code>):</strong> A local storage key that remembers whether you prefer Light or Dark mode.
                  </li>
                </ul>
                <p>
                  We do <strong className="text-foreground">not</strong> use third-party tracking or advertising cookies.
                </p>
              </div>
            </section>

            {/* 10. Contact Information */}
            <section
              id="contact"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-card/40 p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <div className="rounded-xl bg-accent/15 p-2.5">
                  <Mail className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    10. Contact Us
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Reach out for privacy inquiries or compliance requests
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  If you have questions, concerns, or requests regarding this Privacy Policy or how your multi-tenant financial data is handled, please contact our team:
                </p>

                <div className="rounded-xl border border-border/70 bg-background/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-semibold text-foreground">OrgFinance Compliance Team</div>
                    <div className="text-xs text-muted-foreground">
                      Email: <a href="mailto:hello@orgfinance.com" className="text-accent hover:underline">hello@orgfinance.com</a>
                    </div>
                  </div>
                  <Button size="sm" asChild className="gap-2">
                    <a href="mailto:hello@orgfinance.com?subject=Privacy%20Inquiry">
                      <Mail className="h-4 w-4" />
                      Send Email
                    </a>
                  </Button>
                </div>
              </div>
            </section>

            {/* Interactive Policy Acknowledgment Bar */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-sm">Policy Acknowledgment</h3>
                <p className="text-xs text-muted-foreground">
                  Confirm that you have reviewed the OrgFinance multi-tenant privacy & data archiving conventions.
                </p>
              </div>

              <Button
                size="sm"
                variant={acknowledged ? 'outline' : 'default'}
                onClick={() => setAcknowledged(true)}
                disabled={acknowledged}
                className="gap-2 shrink-0"
              >
                {acknowledged ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Acknowledged for Session
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    I Understand & Acknowledge
                  </>
                )}
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
