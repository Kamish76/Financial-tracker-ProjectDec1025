"use client";

import { useState } from "react";
import { signUpWithEmailPassword } from "../auth/signup-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DebugPage() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("TestPassword123!");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSignUp = async () => {
    setStatus("submitting");
    setMessage(null);

    const result = await signUpWithEmailPassword(email, password);
    
    if (result?.error) {
      setMessage(`Error: ${result.error}`);
    } else if (result?.success) {
      setMessage(`Success! Account created for ${result.user?.email}`);
    }
    
    setStatus("idle");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Debug: Create Test User</CardTitle>
          <CardDescription>Create a test account to verify login flow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="TestPassword123!"
            />
          </div>

          <Button 
            onClick={handleSignUp} 
            disabled={status === "submitting"}
            className="w-full"
          >
            {status === "submitting" ? "Creating..." : "Create Test User"}
          </Button>

          {message && (
            <div className={`p-3 rounded text-sm ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {message}
            </div>
          )}

          <div className="pt-4 border-t space-y-2 text-sm">
            <p><strong>Test Credentials:</strong></p>
            <p>Email: {email}</p>
            <p>Password: {password}</p>
            <p className="text-xs text-muted-foreground mt-4">Use these to test the login at /auth</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
