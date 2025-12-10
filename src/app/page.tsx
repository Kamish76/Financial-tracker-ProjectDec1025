import Link from "next/link";
import { ArrowRight, ShieldCheck, Signal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

const quickStats = [
  { label: "Active workspaces", value: "12", detail: "Split by client" },
  { label: "Monthly burn", value: "$248k", detail: "Live from Supabase" },
  { label: "Approvals this week", value: "18", detail: "Across teams" },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 rounded-3xl border border-border/70 bg-card px-8 py-10 shadow-sm md:grid-cols-[1.3fr,1fr]">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-accent" aria-hidden />
            OrgFinance
          </div>
          <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Multi-tenant finances with Supabase auth baked in.
          </h1>
          <p className="text-lg text-muted-foreground">
            Spin up workspaces, connect ledgers, and keep every approval in one place. Start by signing in to the new Shadcn-powered login.
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
          {quickStats.map((item) => (
            <Card key={item.label} className="bg-background/60">
              <CardContent className="space-y-1 p-5">
                <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                  {item.label}
                  <Signal className="h-4 w-4 text-accent" aria-hidden />
                </CardDescription>
                <CardTitle className="text-xl">{item.value}</CardTitle>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
