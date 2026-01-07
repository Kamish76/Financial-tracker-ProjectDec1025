"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { signInWithEmailPassword } from "./actions";
import { signUpWithEmailPassword } from "./signup-actions";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const disabled = useMemo(() => !email || !password || status === "submitting", [email, password, status]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage(null);

    if (isSignUp) {
      // Sign up
      const result = await signUpWithEmailPassword(email, password);
      
      if (result?.error) {
        setMessage(result.error);
        setStatus("idle");
        return;
      }

      setMessage('Account created! Check your email to verify, then login.');
      setStatus("idle");
      setEmail("");
      setPassword("");
      setIsSignUp(false);
      return;
    } else {
      // Sign in
      const result = await signInWithEmailPassword(email, password);
      
      if (result?.error) {
        setMessage(result.error);
        setStatus("idle");
        return;
      }
      
      setStatus("done");
    }
  };

  const handleGoogle = async () => {
    if (status === "submitting") return;
    setStatus("submitting");
    setMessage(null);

    // Use the configured redirect URI from Google Cloud Console
    // This must match exactly what's configured in Google OAuth settings
    const redirectTo = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setMessage(error.message ?? "Google sign-in failed. Try again.");
      setStatus("idle");
    }
  };

  return (
    <div className="grid min-h-[75vh] gap-8 lg:grid-cols-[1.05fr,0.95fr]">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-accent-muted/80 via-card to-background shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.14),transparent_40%)]" aria-hidden />
        <div className="relative z-10 p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-foreground shadow-sm backdrop-blur">
            <LockKeyhole className="h-3.5 w-3.5 text-accent" />
            OrgFinance Access
          </div>
          <h1 className="mt-6 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Secure login for teams and finance admins.
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Sign in to manage clients, budgets, and approvals across workspaces. SSO is coming soon; for now use your OrgFinance credentials.
          </p>
          <div className="mt-8 grid gap-3 text-sm font-medium text-foreground/90">
            {["Fine-grained project access", "Realtime cashflow visibility", "Audit-ready activity logs"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur">
                <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card className="backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle>{isSignUp ? 'Create Account' : 'Log in'}</CardTitle>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
              }}
              className="text-xs text-accent hover:underline"
            >
              {isSignUp ? 'Have an account? Log in' : 'Need an account? Sign up'}
            </button>
          </div>
          <CardDescription>
            {isSignUp 
              ? 'Create your OrgFinance account to get started.' 
              : 'Use the email and password you created for OrgFinance.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-accent" aria-hidden />
                Work email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setStatus("idle");
                }}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-foreground">
                <LockKeyhole className="h-4 w-4 text-accent" aria-hidden />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setStatus("idle");
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <p className="text-xs text-muted-foreground">We never store plaintext passwords.</p>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 text-foreground">
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                Secure by Supabase Auth
              </div>
              <a className="text-accent font-semibold" href="#" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>

            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={disabled}>
                {status === "submitting" 
                  ? (isSignUp ? "Creating..." : "Signing in...") 
                  : status === "done" 
                  ? "Signed in" 
                  : (isSignUp ? "Create Account" : "Sign in")}
                <ArrowRight className={cn("ml-2 h-4 w-4 transition", status !== "submitting" && "translate-x-0.5")} aria-hidden />
              </Button>
              {!isSignUp && (
                <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={status === "submitting"}>
                  Continue with Google
                </Button>
              )}
            </div>

            {message ? (
              <p className={`text-sm ${message.includes('Error') || message.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </p>
            ) : null}

            <p className="text-center text-sm text-muted-foreground">
              Need an account? <span className="font-semibold text-foreground">Ask your workspace admin.</span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
