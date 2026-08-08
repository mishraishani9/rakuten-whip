import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle, useAuth } from "@/hooks/useAuth";

const TITLE = "Sign in — WHIP Intellectual Property Quiz";
const DESCRIPTION =
  "Sign in to WHIP with Google or email to play IP quiz sessions, or request presenter access from an admin.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (auth.user) void navigate({ to: "/", replace: true });
  }, [auth.user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        setMessage(
          data.session
            ? "Account created. You are signed in as a player."
            : "Check your inbox to confirm your email, then sign in.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="stage-backdrop relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <span className="smoke-veil pointer-events-none absolute inset-0" aria-hidden="true" />
      <section className="relative w-full max-w-md rounded-2xl border border-border bg-card/85 p-6">
        <Link to="/" className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
          ← Main menu
        </Link>
        <h1 className="mt-3 text-gradient-gold font-display text-3xl font-black uppercase tracking-tight">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          New accounts start as players. Admins can promote you to presenter.
        </p>

        <Button className="mt-5 w-full" onClick={() => void signInWithGoogle()}>
          Continue with Google
        </Button>

        <form className="mt-5 space-y-3" onSubmit={(e) => void submit(e)}>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
            {mode === "signin" ? "Sign in with email" : "Register"}
          </Button>
        </form>

        {message && <p className="mt-4 text-sm text-foreground">{message}</p>}

        <button
          type="button"
          className="mt-5 text-xs uppercase tracking-widest text-gold underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Need an account? Register" : "Already registered? Sign in"}
        </button>
      </section>
    </main>
  );
}
