import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GAME_SETTINGS, PAWN_COLORS } from "@/game/config";
import type { SetupPlayer } from "@/game/useGameEngine";

function defaultPlayers(count: number): SetupPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    name: `Player ${i + 1}`,
    color: PAWN_COLORS[i % PAWN_COLORS.length]!,
  }));
}

export function SetupScreen({
  bankSize,
  bankError,
  hasStoredGame,
  onResume,
  onStart,
}: {
  bankSize: number;
  bankError: string | null;
  hasStoredGame: boolean;
  onResume: () => void;
  onStart: (gameName: string, players: SetupPlayer[]) => void;
}) {
  const [gameName, setGameName] = useState(
    `IP Workshop ${new Date().toLocaleDateString("en-GB")}`,
  );
  const [players, setPlayers] = useState<SetupPlayer[]>(defaultPlayers(4));

  const setCount = (count: number) => {
    const clamped = Math.max(GAME_SETTINGS.MIN_PLAYERS, Math.min(GAME_SETTINGS.MAX_PLAYERS, count));
    setPlayers((prev) =>
      Array.from({ length: clamped }, (_, i) => prev[i] ?? defaultPlayers(clamped)[i]!),
    );
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Presenter-controlled workshop game
      </p>
      <h1 className="mt-2 font-display text-4xl font-black uppercase tracking-tight text-foreground">
        Business of IP
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Roll physical dice, enter the value here, and answer intellectual-property questions to travel
        the board. {bankSize > 0 ? `${bankSize} questions loaded.` : "Loading question bank…"}
      </p>
      {bankError && (
        <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">
          {bankError}
        </p>
      )}

      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="game-name">Session name</Label>
            <Input id="game-name" value={gameName} onChange={(e) => setGameName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="player-count">Number of players</Label>
            <Input
              id="player-count"
              type="number"
              min={GAME_SETTINGS.MIN_PLAYERS}
              max={GAME_SETTINGS.MAX_PLAYERS}
              value={players.length}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>
        </div>

        <ul className="mt-5 space-y-2">
          {players.map((p, index) => (
            <li key={p.number} className="flex items-center gap-3">
              <input
                type="color"
                aria-label={`Colour for player ${p.number}`}
                value={p.color}
                onChange={(e) =>
                  setPlayers((prev) =>
                    prev.map((x, i) => (i === index ? { ...x, color: e.target.value } : x)),
                  )
                }
                className="h-9 w-9 cursor-pointer rounded-md border border-border bg-background"
              />
              <Input
                aria-label={`Name for player ${p.number}`}
                value={p.name}
                onChange={(e) =>
                  setPlayers((prev) =>
                    prev.map((x, i) => (i === index ? { ...x, name: e.target.value } : x)),
                  )
                }
              />
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            size="lg"
            onClick={() =>
              onStart(
                gameName.trim() || "IP Workshop",
                players.map((p, i) => ({ ...p, name: p.name.trim() || `Player ${i + 1}` })),
              )
            }
          >
            Start game
          </Button>
          {hasStoredGame && (
            <Button size="lg" variant="secondary" onClick={onResume}>
              Resume last session
            </Button>
          )}
        </div>
      </section>

      <nav className="mt-6 flex gap-4 text-sm">
        <Link to="/history" className="text-muted-foreground underline hover:text-foreground">
          Game history &amp; analytics
        </Link>
        <Link to="/questions" className="text-muted-foreground underline hover:text-foreground">
          Question bank &amp; CSV import
        </Link>
      </nav>
    </main>
  );
}