"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const nextParam =
    searchParams.get("next") ||
    searchParams.get("redirect") ||
    searchParams.get("redirectTo");
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
      const result = await signInWithEmailPassword(email, password, nextParam || undefined);
      
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
    const callbackBase = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`;
    const redirectTo = nextParam
      ? `${callbackBase}?next=${encodeURIComponent(nextParam)}`
      : callbackBase;
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
    <div className="grid min-h-screen gap-6 p-4 lg:grid-cols-[minmax(280px,360px)_1fr] lg:p-6">
      <aside className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-[0_25px_80px_-35px_rgba(15,23,42,0.95)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_35%)]" aria-hidden />
        <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur">
              <LockKeyhole className="h-3.5 w-3.5 text-accent" />
              OrgFinance Access
            </div>
            <h1 className="mt-6 max-w-sm text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Secure login for teams and finance admins.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300 sm:text-base">
              Sign in to manage clients, budgets, and approvals across workspaces. SSO is coming soon; for now use your OrgFinance credentials.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {["Fine-grained project access", "Realtime cashflow visibility", "Audit-ready activity logs"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-medium text-white/90 backdrop-blur">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/8 p-4 text-xs leading-5 text-slate-300 backdrop-blur">
            Keep this page as the public entry point. Returning users will be routed straight to the app after sign-in.
          </div>
        </div>
      </aside>

      <section className="flex items-center justify-center">
        <Card className="w-full max-w-2xl border-border/70 bg-card/95 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.4)] backdrop-blur">
          <CardHeader className="space-y-2 border-b border-border/60 pb-6">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-2xl">{isSignUp ? 'Create Account' : 'Log in'}</CardTitle>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage(null);
                }}
                className="text-xs font-semibold text-accent hover:underline"
              >
                {isSignUp ? 'Have an account? Log in' : 'Need an account? Sign up'}
              </button>
            </div>
            <CardDescription className="max-w-xl text-base">
              {isSignUp
                ? 'Create your OrgFinance account to get started.'
                : 'Use the email and password you created for OrgFinance.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
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

              <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                  Secure by Supabase Auth
                </div>
                <a className="font-semibold text-accent" href="#" onClick={(e) => e.preventDefault()}>
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
      </section>
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
