import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

/** Wraps presenter/admin-only pages. `adminOnly` narrows it further. */
export function StaffGate({ adminOnly = false, children }: { adminOnly?: boolean; children: React.ReactNode }) {
  const auth = useAuth();
  if (auth.loading) return <main className="p-8 text-sm text-muted-foreground">Checking access…</main>;
  const allowed = adminOnly ? auth.isAdmin : auth.isStaff;
  if (!allowed) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-black uppercase text-foreground">
          {adminOnly ? "Admins only" : "Presenters & admins only"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {auth.user
            ? "Ask an admin to grant you access, then reload this page."
            : "Sign in with an account that has access."}
        </p>
        <Button className="mt-5" asChild>
          <Link to={auth.user ? "/" : "/auth"}>{auth.user ? "Back to menu" : "Sign in"}</Link>
        </Button>
      </main>
    );
  }
  return <>{children}</>;
}
