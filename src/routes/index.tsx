import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SoundControls } from "@/components/game/SoundControls";
import { useAuth, signInWithGoogle, signOutEverywhere } from "@/hooks/useAuth";
import { loadStoredState } from "@/game/useGameEngine";
import { gameAudio } from "@/game/audio";
import { cn } from "@/lib/utils";

const TITLE = "Rakuten FLIP — Fun & Learning in Intellectual Property Quiz Game";
const DESCRIPTION =
  "Rakuten FLIP is a presenter-led quiz-show board game for intellectual-property awareness workshops: dynamic boards, timed rounds, live scoreboards and session analytics.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function MenuButton({
  to,
  label,
  hint,
  onClick,
  disabled,
}: {
  to?: string;
  label: string;
  hint?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const inner = (
    <span className="flex flex-col items-center">
      <span className="font-display text-lg font-black uppercase tracking-[0.18em]">{label}</span>
      {hint && <span className="text-[0.65rem] uppercase tracking-widest text-primary-foreground/70">{hint}</span>}
    </span>
  );
  const classes = cn(
    "lozenge flex w-full max-w-md items-center justify-center px-10 py-4 text-center",
    disabled ? "opacity-40" : "hover:scale-[1.03] hover:brightness-125",
  );
  if (to && !disabled) {
    return (
      <Link to={to} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  );
}

function Home() {
  const auth = useAuth();
  const [splash, setSplash] = useState(true);
  const [hasStored, setHasStored] = useState(false);

  useEffect(() => {
    setHasStored(loadStoredState() !== null);
    const id = window.setTimeout(() => setSplash(false), 2300);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    gameAudio.playTrack("menu");
    const unlock = () => gameAudio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  if (splash) {
    return (
      <main
        className="stage-backdrop relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
        onClick={() => setSplash(false)}
      >
        <span className="smoke-veil pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="absolute right-4 top-4 z-10"
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          <SoundControls />
        </div>
        <div className="relative flex h-56 w-56 items-center justify-center rounded-full border-4 border-gold/70 bg-primary/20 shadow-gold-glow animate-glow-pulse sm:h-72 sm:w-72">
          <div className="absolute inset-4 rounded-full border border-accent/60" />
          <div className="px-6 text-center">
            <p className="text-[0.62rem] uppercase tracking-[0.4em] text-muted-foreground">Rakuten</p>
            <p className="text-gradient-gold font-display text-5xl font-black tracking-[0.1em] sm:text-6xl">FLIP</p>
            <p className="mt-1 text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
              © ® ™ Quiz Show
            </p>
          </div>
        </div>
        <h1 className="relative mt-8 max-w-xl px-4 text-center font-display text-base font-black uppercase tracking-[0.16em] text-foreground sm:text-xl sm:tracking-[0.2em]">
          Fun &amp; Learning in Intellectual Property
        </h1>
        <p className="relative mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">Tap to continue</p>
      </main>
    );
  }

  return (
    <main className="stage-backdrop relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-10">
      <span className="smoke-veil pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2" aria-hidden="true" />

      <div className="relative flex w-full max-w-md items-center justify-between text-xs">
        <span className="uppercase tracking-[0.25em] text-muted-foreground">
          {auth.loading ? "…" : auth.user ? `${auth.displayName} · ${auth.roles.join(", ")}` : "Guest · player"}
        </span>
        <SoundControls />
        {auth.user ? (
          <button
            type="button"
            className="uppercase tracking-[0.2em] text-gold underline"
            onClick={() => void signOutEverywhere()}
          >
            Sign out
          </button>
        ) : (
          <Link to="/auth" className="uppercase tracking-[0.2em] text-gold underline">
            Sign in
          </Link>
        )}
      </div>

      <div className="relative mt-6 text-center">
        <p className="text-gradient-gold font-display text-4xl font-black tracking-[0.12em] sm:text-5xl">
          Rakuten FLIP
        </p>
        <p className="mt-1 text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground">
          Fun &amp; Learning in Intellectual Property
        </p>
      </div>

      <nav className="relative mt-9 flex w-full flex-col items-center gap-3.5">
        <MenuButton to="/play" label="New Game" hint="Configure board &amp; players" />
        <MenuButton to="/play" label="Load Game" hint={hasStored ? "Resume saved session" : "No saved session"} disabled={!hasStored} />
        {auth.isStaff && <MenuButton to="/history" label="Games History" hint="Every past session" />}
        {auth.isStaff && <MenuButton to="/history" label="Analytics" hint="Cross-session insights" />}
        {auth.isStaff && <MenuButton to="/questions" label="Audit Questions" hint="Review &amp; correct the bank" />}
        {auth.isStaff && <MenuButton to="/upload" label="Bulk Upload" hint="Import questions from CSV" />}
        {auth.isAdmin && <MenuButton to="/admin" label="Roles &amp; Invites" hint="Approve presenters" />}
        {!auth.user && (
          <MenuButton label="Continue with Google" hint="Sign in for roles" onClick={() => void signInWithGoogle()} />
        )}
      </nav>

      <p className="relative mt-10 max-w-lg text-center text-xs text-muted-foreground">
        Everyone signs in as a player by default. Presenters and admins unlock games history, analytics,
        question auditing, bulk upload and in-game player management. Roles &amp; identity management is
        admin-only.
      </p>

      {!auth.user && (
        <Button variant="ghost" className="relative mt-4 text-xs uppercase tracking-widest" asChild>
          <Link to="/auth">Email sign-in / register</Link>
        </Button>
      )}
    </main>
  );
}
