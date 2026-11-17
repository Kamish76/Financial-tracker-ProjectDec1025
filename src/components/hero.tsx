import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  Receipt,
  Wallet,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Crown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHeroStatistics } from "@/app/actions";
import { formatCurrency } from "@/lib/utils";

/**
 * Formats a number with commas for thousands separator
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

const previewTransactions = [
  {
    id: "tx-1",
    title: "Annual Tech Summit Sponsorship",
    meta: "Business Fund · Income",
    badge: "Org Revenue",
    badgeTone: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    amount: "+$3,200.00",
    amountTone: "text-emerald-600 dark:text-emerald-400",
    icon: ArrowDownLeft,
  },
  {
    id: "tx-2",
    title: "Venue Sound System Deposit",
    meta: "Paid by Alex M. · Out-of-Pocket",
    badge: "Reimbursable",
    badgeTone: "bg-accent/15 text-accent-strong border-accent/30",
    amount: "-$640.00",
    amountTone: "text-foreground",
    icon: ArrowUpRight,
  },
  {
    id: "tx-3",
    title: "Main Bank → Cash Sub-Account",
    meta: "Personal Wallet · Instant Transfer",
    badge: "Wallet Mode",
    badgeTone: "bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25",
    amount: "$250.00",
    amountTone: "text-muted-foreground",
    icon: ArrowLeftRight,
  },
];

export async function Hero() {
  // Fetch statistics with error handling
  let stats;
  try {
    stats = await getHeroStatistics();
  } catch (error) {
    console.error("Failed to load hero statistics:", error);
    stats = {
      organizationCount: 0,
      totalContributions: 0,
      transactionCount: 0,
      cashOnHand: 0,
    };
  }

  const isEmpty = stats.organizationCount === 0 && stats.transactionCount === 0;
  const orgDetailText = isEmpty ? "Ready to launch" : "Active workspaces";
  const contributionsDetailText = isEmpty ? "Tracked per member" : "Out-of-pocket logged";
  const transactionsDetailText = isEmpty ? "Real-time ledger" : "Verified entries";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/90 p-6 sm:p-10 lg:p-12 shadow-sm">
      {/* Subtle decorative corner glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl dark:bg-accent/15"
      />

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        {/* Left Column: Value Proposition + CTAs + Compact Live Stats Strip */}
        <div className="space-y-8 min-w-0">
          <div className="space-y-5">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-2xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-accent-strong">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Dual-Mode Finance Engine
              </span>
              <span className="text-border">•</span>
              <span>Team Organizations &amp; Personal Wallets</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl sm:leading-[1.12] text-balance">
              Every peso &amp; dollar accounted for—from{" "}
              <span className="text-accent-strong">shared treasuries</span> to your{" "}
              <span className="underline decoration-accent/50 decoration-2 underline-offset-4">
                personal wallet
              </span>
              .
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl">
              Separate operational business expenses from out-of-pocket member contributions so you always know who is owed what—or switch to{" "}
              <span className="font-medium text-foreground">Personal Wallet Mode</span> for clean, multi-account daily expense tracking without collaborative clutter.
            </p>
          </div>

          {/* Primary & Secondary Actions */}
          <div className="flex flex-wrap items-center gap-3 [flex-wrap:balance]">
            <Button size="lg" className="gap-2 px-6 shadow-xs" asChild>
              <Link href="/auth">
                Start tracking free
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" className="gap-2 px-5" asChild>
              <Link href="#modes">Explore Workspace Modes</Link>
            </Button>
          </div>

          {/* Compact Live Platform Stats Strip */}
          <div className="pt-2">
            <div className="mb-2.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Live platform activity across organizations &amp; wallets</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-border/70 bg-background/60 p-3.5">
              <div className="flex items-center gap-3 rounded-xl bg-card/70 px-3.5 py-2.5 border border-border/50 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent-strong">
                  <Users className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    Workspaces
                  </p>
                  <p className="font-mono text-lg font-bold tabular-nums text-foreground leading-tight">
                    {formatNumber(stats.organizationCount)}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {orgDetailText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-card/70 px-3.5 py-2.5 border border-border/50 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent-strong">
                  <TrendingUp className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    Contributions
                  </p>
                  <p className="font-mono text-lg font-bold tabular-nums text-foreground leading-tight truncate">
                    {formatCurrency(stats.totalContributions)}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {contributionsDetailText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-card/70 px-3.5 py-2.5 border border-border/50 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent-strong">
                  <Receipt className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    Transactions
                  </p>
                  <p className="font-mono text-lg font-bold tabular-nums text-foreground leading-tight">
                    {formatNumber(stats.transactionCount)}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {transactionsDetailText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive-Style Dashboard & Wallet Preview Card */}
        <div className="relative min-w-0">
          <div className="rounded-2xl border border-border/80 bg-background/90 p-4 sm:p-5 shadow-md space-y-4">
            {/* Mockup Header: Mode Context Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-strong">
                  <Building2 className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate">
                      Apex Student Venture
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                      <Crown className="h-2.5 w-2.5" aria-hidden />
                      Owner
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Multi-Tenant Treasury · 8 Active Members
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-strong" aria-hidden />
                RLS Protected
              </span>
            </div>

            {/* Balance Split Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1 min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Org Cash on Hand
                </p>
                <p className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-foreground truncate">
                  $14,820.00
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Net business treasury
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1 min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Member Equity Owed
                </p>
                <p className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-accent-strong truncate">
                  $1,290.00
                </p>
                <p className="text-[11px] text-muted-foreground">
                  3 out-of-pocket claims
                </p>
              </div>
            </div>

            {/* Live Ledger Rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-foreground">
                  Recent Accountability Ledger
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Source &amp; Fund Verified
                </span>
              </div>

              <div className="space-y-2">
                {previewTransactions.map((tx) => {
                  const Icon = tx.icon;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 transition-colors hover:bg-muted/60 min-w-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                          <Icon className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {tx.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {tx.meta}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span
                          className={`font-mono text-xs font-semibold tabular-nums ${tx.amountTone}`}
                        >
                          {tx.amount}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${tx.badgeTone}`}
                        >
                          {tx.badge}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Personal Wallet Sub-Accounts Strip inside Preview */}
            <div className="rounded-xl border border-accent/30 bg-accent/8 dark:bg-accent/10 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Wallet className="h-4 w-4 text-accent-strong shrink-0" aria-hidden />
                  <span className="text-xs font-semibold text-foreground truncate">
                    Personal Wallet Sub-Accounts
                  </span>
                </div>
                <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-accent-strong border border-accent/20">
                  1-Click Switch
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-card/90 border border-border/60 px-2.5 py-1.5 min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">Cash</p>
                  <p className="font-mono text-xs font-semibold tabular-nums text-foreground truncate">
                    $420.00
                  </p>
                </div>
                <div className="rounded-lg bg-card/90 border border-border/60 px-2.5 py-1.5 min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">Main Bank</p>
                  <p className="font-mono text-xs font-semibold tabular-nums text-foreground truncate">
                    $3,850.00
                  </p>
                </div>
                <div className="rounded-lg bg-card/90 border border-border/60 px-2.5 py-1.5 min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">Savings</p>
                  <p className="font-mono text-xs font-semibold tabular-nums text-foreground truncate">
                    $6,100.00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

