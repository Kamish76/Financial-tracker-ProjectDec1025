import { 
  Building2, 
  Users, 
  DollarSign, 
  Shield, 
  BarChart3, 
  FileText,
  UserCog,
  RefreshCw,
  Lock,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Building2,
    title: "Multi-Tenant Organizations",
    description: "Create and manage multiple organizations with isolated workspaces. Each organization has its own financial records and member access controls."
  },
  {
    icon: Shield,
    title: "Secure Authentication",
    description: "Built on Supabase Auth with Row-Level Security (RLS) policies ensuring users can only access their authorized organization data."
  },
  {
    icon: DollarSign,
    title: "Income & Expense Tracking",
    description: "Comprehensive transaction management with categorized expenses and income. Track all financial movements with detailed records."
  },
  {
    icon: Users,
    title: "Member Management",
    description: "Invite team members, assign roles (owner, admin, member), and manage permissions. Support for member deactivation and soft deletes."
  },
  {
    icon: BarChart3,
    title: "Real-Time Balance Tracking",
    description: "Automated member balance calculations with allocation tracking. View who owes what at a glance with live updates."
  },
  {
    icon: FileText,
    title: "Transaction Categories",
    description: "Organize expenses and income with predefined and custom categories. Better insights into spending patterns."
  },
  {
    icon: UserCog,
    title: "Role-Based Access Control",
    description: "Granular permission system with owner, admin, and member roles. Transfer ownership and manage team permissions seamlessly."
  },
  {
    icon: RefreshCw,
    title: "Refund Management",
    description: "Handle refunds and adjustments with dedicated refund tracking. Maintain accurate financial records with transaction history."
  },
  {
    icon: Lock,
    title: "Invite System",
    description: "Secure invite codes for joining organizations. Control who can access your workspace with expiring invite links."
  },
  {
    icon: Zap,
    title: "Accountability System",
    description: "Track user actions and maintain audit logs. Enhanced transparency with keep-alive monitoring for system health."
  }
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Everything you need to manage finances
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A complete financial management platform built with modern technologies. 
          All features are implemented and working in production.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card 
              key={feature.title} 
              className="border-border/70 bg-card hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-accent/10 p-2.5 ring-1 ring-accent/20">
                    <Icon className="h-5 w-5 text-accent" aria-hidden />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/30 px-6 py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Powered by <span className="font-semibold text-foreground">Next.js 15</span>, 
          <span className="font-semibold text-foreground"> Supabase</span>, 
          <span className="font-semibold text-foreground"> TypeScript</span>, and 
          <span className="font-semibold text-foreground"> Shadcn UI</span>
        </p>
      </div>
    </section>
  );
}
