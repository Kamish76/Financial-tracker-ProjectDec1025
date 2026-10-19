import Link from "next/link";
import {
  Building2,
  Wallet,
  Shield,
  BarChart3,
  Tags,
  UserCog,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Calculator,
  ArrowLeftRight,
  KeyRound,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const organizationHighlights = [
  "Separate Business Funds from Member Out-of-Pocket Contributions",
  "Track per-member reimbursement balances & held fund allocations",
  "Invite team members via 12-character alphanumeric codes",
  "Granular Owner, Admin, and Member role permissions",
];

const walletHighlights = [
  "Dedicated single-user workspace with zero multi-member noise",
  "Auto-spawned Cash sub-account plus custom Bank & Savings accounts",
  "Instant account-to-account balance transfers & starting values",
  "Built-in math expression calculator for fast transaction entry",
];

const bentoFeatures = [
  {
    icon: BarChart3,
    badge: "Accounting Precision",
    title: "True Profitability & Fund Source Tracking",
    description:
      "Standard trackers lump all expenses together. OrgFinance distinguishes between expenses paid from the organization's cash-on-hand and capital injected out-of-pocket by members—giving you accurate Cash on Hand and Net Profit at all times.",
    span: "lg:col-span-2",
    highlights: ["Business Expense", "Member Capital", "Initial Setup Balances"],
  },
  {
    icon: RefreshCw,
    badge: "Member Accountability",
    title: "Reimbursements & Held Allocations",
    description:
      "Automatically calculate who is owed what from out-of-pocket purchases, record member refunds, and track baseline business funds held by specific team members.",
    span: "lg:col-span-1",
    highlights: ["Live Member Ledger", "Refund History"],
  },
  {
    icon: Layers,
    badge: "Personal Wallet Mode",
    title: "Multi-Account Sub-Ledgers",
    description:
      "Organize personal money across Cash, checking accounts, and e-wallets. Transfer funds between sub-accounts and safely archive old accounts without losing historical records.",
    span: "lg:col-span-1",
    highlights: ["Sub-Accounts", "Safe Archiving"],
  },
  {
    icon: UserCog,
    badge: "Team Governance",
    title: "Role-Based Access & Atomic Ownership",
    description:
      "Control who can record transactions, manage members, or configure settings with Owner, Admin, and Member roles—plus transactional ownership transfer.",
    span: "lg:col-span-1",
    highlights: ["Owner / Admin / Member", "12-Char Invite Codes"],
  },
  {
    icon: Tags,
    badge: "Smart Organization",
    title: "Custom Categories with History Protection",
    description:
      "Start immediately with seeded income and expense categories or create your own. Removing a category cleans up future dropdowns while preserving labels on past transactions.",
    span: "lg:col-span-1",
    highlights: ["Preset Seeding", "Audit-Safe Labels"],
  },
  {
    icon: Shield,
    badge: "Enterprise-Grade Foundation",
    title: "Row-Level Security & Always-On Uptime",
    description:
      "Every workspace is isolated at the PostgreSQL layer via Supabase Row-Level Security (RLS) policies and backed by automated daily health-check heartbeats so your ledger is always ready.",
    span: "lg:col-span-3",
    highlights: ["Supabase RLS Isolation", "Automated Keep-Alive Cron", "Full Audit Trail"],
  },
];

export function Features() {
  return (
    <div className="space-y-20 sm:space-y-28">
      {/* Section 1: Dual-Mode Showcase (#modes) */}
      <section id="modes" className="scroll-mt-20 space-y-10">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-strong">
            Two Tailored Modes · One Unified Account
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Built for collaborative treasuries and personal daily wallets
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Switch effortlessly between multi-member organizations and your private personal wallet from the same sidebar.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mode 1: Team & Organization Mode */}
          <Card className="relative overflow-hidden border-border/80 bg-card flex flex-col justify-between shadow-xs hover:border-accent/40 transition-colors">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2.5 rounded-xl bg-accent/12 px-3 py-1.5 text-accent-strong">
                  <Building2 className="h-5 w-5" aria-hidden />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Multi-Tenant Mode
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <KeyRound className="h-3 w-3 text-accent-strong" aria-hidden />
                  Invite-Ready
                </span>
              </div>

              <CardTitle className="text-2xl font-bold text-foreground">
                Team &amp; Organization Workspaces
              </CardTitle>
              <CardDescription className="text-sm sm:text-base leading-relaxed">
                Designed for student councils, clubs, co-founders, and small businesses where multiple people spend, collect revenue, and need transparent reimbursement tracking.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-2.5">
                {organizationHighlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2
                      className="h-4 w-4 text-accent-strong shrink-0 mt-0.5"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Mini Visual Preview for Organization Mode */}
              <div className="rounded-xl border border-border/70 bg-background/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Member Accountability</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Code: ORGF-92K4-X8P1
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2 min-w-0">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        Samira R.
                      </p>
                      <p className="text-[11px] text-muted-foreground">Out-of-pocket</p>
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums text-accent-strong">
                      +$480.00
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2 min-w-0">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        Marco D.
                      </p>
                      <p className="text-[11px] text-muted-foreground">Held allocation</p>
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                      $300.00
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mode 2: Personal Wallet Mode */}
          <Card className="relative overflow-hidden border-border/80 bg-card flex flex-col justify-between shadow-xs hover:border-accent/40 transition-colors">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2.5 rounded-xl bg-accent/12 px-3 py-1.5 text-accent-strong">
                  <Wallet className="h-5 w-5" aria-hidden />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Single-Tenant Mode
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <Calculator className="h-3 w-3 text-accent-strong" aria-hidden />
                  Quick-Add Calc
                </span>
              </div>

              <CardTitle className="text-2xl font-bold text-foreground">
                Personal Wallet Mode
              </CardTitle>
              <CardDescription className="text-sm sm:text-base leading-relaxed">
                A streamlined personal finance hub that strips away multi-user complexity so you can track sub-accounts, transfers, and daily spending in seconds.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-2.5">
                {walletHighlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2
                      className="h-4 w-4 text-accent-strong shrink-0 mt-0.5"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Mini Visual Preview for Personal Wallet Mode */}
              <div className="rounded-xl border border-border/70 bg-background/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Active Sub-Accounts</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-accent-strong font-medium">
                    <ArrowLeftRight className="h-3 w-3" aria-hidden />
                    Instant Transfers
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border/60 bg-card px-2.5 py-2 min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground truncate">
                      Cash
                    </p>
                    <p className="font-mono text-xs font-semibold tabular-nums text-foreground truncate">
                      $420.00
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card px-2.5 py-2 min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground truncate">
                      Checking
                    </p>
                    <p className="font-mono text-xs font-semibold tabular-nums text-foreground truncate">
                      $3,850.00
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card px-2.5 py-2 min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground truncate">
                      Savings
                    </p>
                    <p className="font-mono text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 truncate">
                      $6,100.00
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 2: Bento Feature Grid (#features) */}
      <section id="features" className="scroll-mt-20 space-y-10">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Complete Financial Toolkit
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Everything you need to keep every balance crystal clear
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Purpose-built workflows for real-world accounting, member equity, and day-to-day clarity.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {bentoFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className={`border-border/80 bg-card/90 hover:border-border transition-colors flex flex-col justify-between ${feature.span}`}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 text-accent-strong ring-1 ring-accent/25">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {feature.badge}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>

                  <div className="flex flex-wrap gap-1.5 [flex-wrap:balance] pt-1">
                    {feature.highlights.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-md bg-muted/70 px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Section 3: Closing CTA Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card px-6 py-12 sm:px-12 sm:py-16 text-center shadow-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 max-w-xl rounded-full bg-accent/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Ready to bring clarity to your organization or personal wallet?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Create an organization workspace, join your team with an invite code, or spin up your private Personal Wallet in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 [flex-wrap:balance]">
            <Button size="lg" className="gap-2 px-7 shadow-xs" asChild>
              <Link href="/auth">
                Get started now
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/privacy">Read Privacy Policy</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Powered by{" "}
            <span className="font-semibold text-foreground">Next.js 16</span>,{" "}
            <span className="font-semibold text-foreground">Supabase RLS</span>,{" "}
            <span className="font-semibold text-foreground">TypeScript</span>, and{" "}
            <span className="font-semibold text-foreground">Tailwind CSS v4</span>
          </p>
        </div>
      </section>
    </div>
  );
}

