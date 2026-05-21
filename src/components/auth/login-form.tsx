"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

export function LoginForm({ searchParams: sp }: { searchParams: Record<string, string | undefined> }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const configured = useMemo(
    () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    []
  );

  async function onPasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.error("Supabase environment variables are not configured.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in");
      router.push(sp.next && sp.next.startsWith("/") ? sp.next : "/dashboard");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.error("Supabase environment variables are not configured.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error) throw error;
      toast.success("Check your email for the magic link.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not send magic link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication</CardTitle>
        <CardDescription>
          {sp.error === "config"
            ? "Server is missing Supabase configuration. Copy `.env.example` to `.env.local`."
            : "Use password auth for development, or send a magic link."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-3" onSubmit={onPasswordSignIn}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Sign in with password
          </Button>
        </form>
        <form className="space-y-3" onSubmit={onMagicLink}>
          <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
            Email me a magic link
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Need an account?{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/signup">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
