import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/useAuth";

const TITLE = "Roles & Presenter Invites — WHIP Admin";
const DESCRIPTION =
  "WHIP admin console: invite or approve presenters, and manage player, presenter and admin roles for workshop accounts.";

export const Route = createFileRoute("/admin")({
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
  component: AdminPage,
});

type PersonRow = { id: string; name: string; email: string | null; roles: AppRole[] };
type InviteRow = { id: string; email: string; status: string };

function AdminPage() {
  const auth = useAuth();
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [{ data: profiles }, { data: roles }, { data: inviteRows }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, email").order("display_name"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("presenter_invites").select("id, email, status").order("created_at", { ascending: false }),
    ]);
    const roleMap = new Map<string, AppRole[]>();
    for (const row of roles ?? []) {
      const list = roleMap.get(row.user_id) ?? [];
      list.push(row.role as AppRole);
      roleMap.set(row.user_id, list);
    }
    setPeople(
      (profiles ?? []).map((p) => ({
        id: p.id,
        name: p.display_name ?? p.email ?? "Player",
        email: p.email,
        roles: roleMap.get(p.id) ?? [],
      })),
    );
    setInvites((inviteRows ?? []) as InviteRow[]);
  }, []);

  useEffect(() => {
    if (auth.isAdmin) void refresh();
  }, [auth.isAdmin, refresh]);

  if (auth.loading) return <main className="p-8 text-sm text-muted-foreground">Checking access…</main>;

  if (!auth.isAdmin) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-black uppercase text-foreground">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask an admin to grant you access, then reload this page.
        </p>
        <Button className="mt-5" asChild>
          <Link to="/">Back to menu</Link>
        </Button>
      </main>
    );
  }

  const toggleRole = async (personId: string, role: AppRole, has: boolean) => {
    setMessage(null);
    try {
      if (has) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", personId).eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: personId, role });
        if (error) throw error;
      }
      await refresh();
    } catch {
      setMessage("Role change failed. Please try again.");
    }
  };

  const invite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setMessage(null);
    try {
      const { error } = await supabase
        .from("presenter_invites")
        .insert({ email, status: "approved", invited_by: auth.user?.id ?? null });
      if (error) throw error;
      const existing = people.find((p) => p.email?.toLowerCase() === email);
      if (existing && !existing.roles.includes("presenter")) {
        await supabase.from("user_roles").insert({ user_id: existing.id, role: "presenter" });
      }
      setInviteEmail("");
      setMessage(`Presenter access granted for ${email}.`);
      await refresh();
    } catch {
      setMessage("Could not save the invite. Please try again.");
    }
  };

  const setInviteStatus = async (id: string, status: string) => {
    const row = invites.find((i) => i.id === id);
    await supabase.from("presenter_invites").update({ status }).eq("id", id);
    if (status === "approved" && row) {
      const person = people.find((p) => p.email?.toLowerCase() === row.email.toLowerCase());
      if (person && !person.roles.includes("presenter")) {
        await supabase.from("user_roles").insert({ user_id: person.id, role: "presenter" });
      }
    }
    await refresh();
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link to="/" className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
        ← Main menu
      </Link>
      <h1 className="mt-3 text-gradient-gold font-display text-3xl font-black uppercase tracking-tight">
        Roles &amp; invites
      </h1>

      {message && <p className="mt-4 text-sm text-foreground">{message}</p>}

      <section className="mt-6 rounded-2xl border border-border bg-card/80 p-5">
        <Label htmlFor="invite-email">Invite a presenter by email</Label>
        <div className="mt-2 flex gap-2">
          <Input
            id="invite-email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="person@example.com"
          />
          <Button onClick={() => void invite()}>Invite</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Invited emails become presenters automatically once they sign in and confirm their email.
        </p>

        {invites.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {invites.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm"
              >
                <span className="flex-1 truncate text-foreground">{i.email}</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{i.status}</span>
                {i.status !== "approved" && (
                  <Button size="sm" variant="secondary" onClick={() => void setInviteStatus(i.id, "approved")}>
                    Approve
                  </Button>
                )}
                {i.status !== "revoked" && (
                  <Button size="sm" variant="ghost" onClick={() => void setInviteStatus(i.id, "revoked")}>
                    Revoke
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <h2 className="mt-8 font-display text-lg font-black uppercase tracking-widest text-foreground">People</h2>
      <ul className="mt-3 space-y-2">
        {people.map((person) => (
          <li key={person.id} className="rounded-xl border border-border bg-card/80 p-3">
            <p className="text-sm font-bold text-foreground">{person.name}</p>
            <p className="text-xs text-muted-foreground">{person.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["player", "presenter", "admin"] as AppRole[]).map((role) => {
                const has = person.roles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => void toggleRole(person.id, role, has)}
                    className={
                      has
                        ? "rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-widest text-gold-foreground"
                        : "rounded-full border border-border px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold"
                    }
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
