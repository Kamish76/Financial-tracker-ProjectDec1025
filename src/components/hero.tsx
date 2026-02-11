import Link from "next/link";
import { ArrowRight, ShieldCheck, Signal, TrendingUp, Users, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { getHeroStatistics } from "@/app/actions";

/**
 * Formats a number with commas for thousands separator
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Formats a currency value with dollar sign and commas
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function Hero() {
  const stats = await getHeroStatistics();
  return (
    <div className="grid gap-6 rounded-3xl border border-border/70 bg-card px-8 py-10 shadow-sm md:grid-cols-[1.3fr,1fr]">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-accent" aria-hidden />
          OrgFinance
        </div>
        <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          Track balances, contributions, and ensure every member stays accountable.
        </h1>
        <p className="text-lg text-muted-foreground">
          Create workspaces for your student groups or small businesses. Distinguish between operational expenses and member contributions to understand your true profitability and who owes what.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button className="gap-2" asChild>
            <Link href="/auth">
              Go to login
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button variant="secondary" className="gap-2" asChild>
            <a href="https://supabase.com" target="_blank" rel="noreferrer">
              Supabase dashboard
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-background/60">
          <CardContent className="space-y-1 p-5">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
              Organizations
              <Users className="h-4 w-4 text-accent" aria-hidden />
            </CardDescription>
            <CardTitle className="text-xl">{formatNumber(stats.organizationCount)}</CardTitle>
            <p className="text-sm text-muted-foreground">Tracking finances</p>
          </CardContent>
        </Card>

        <Card className="bg-background/60">
          <CardContent className="space-y-1 p-5">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
              Contributions
              <TrendingUp className="h-4 w-4 text-accent" aria-hidden />
            </CardDescription>
            <CardTitle className="text-xl">{formatCurrency(stats.totalContributions)}</CardTitle>
            <p className="text-sm text-muted-foreground">Member investments</p>
          </CardContent>
        </Card>

        <Card className="bg-background/60">
          <CardContent className="space-y-1 p-5">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
              Transactions
              <Receipt className="h-4 w-4 text-accent" aria-hidden />
            </CardDescription>
            <CardTitle className="text-xl">{formatNumber(stats.transactionCount)}</CardTitle>
            <p className="text-sm text-muted-foreground">Recorded & tracked</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
