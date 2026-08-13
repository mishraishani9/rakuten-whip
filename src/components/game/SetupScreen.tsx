import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { SoundControls } from "@/components/game/SoundControls";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BOARD_SIZE_OPTIONS, GAME_SETTINGS, PAWN_COLORS, housesPerSide } from "@/game/config";
import type { SetupPlayer, StartOptions } from "@/game/useGameEngine";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type DirectoryEntry = { id: string; name: string; email: string | null };

function defaultPlayers(count: number): SetupPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    name: `Player ${i + 1}`,
    color: PAWN_COLORS[i % PAWN_COLORS.length]!,
  }));
}

function renumber(players: SetupPlayer[]): SetupPlayer[] {
  return players.map((p, i) => ({ ...p, number: i + 1 }));
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
  onStart: (gameName: string, players: SetupPlayer[], options: StartOptions) => void;
}) {
  const [gameName, setGameName] = useState(`Rakuten FLIP Workshop ${new Date().toLocaleDateString("en-GB")}`);
  const [players, setPlayers] = useState<SetupPlayer[]>(defaultPlayers(GAME_SETTINGS.DEFAULT_PLAYERS));
  const [boardSize, setBoardSize] = useState<number>(GAME_SETTINGS.DEFAULT_BOARD_SIZE);
  const [goldenFirst, setGoldenFirst] = useState(true);
  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);

  useEffect(() => {
    void supabase
      .from("profiles")
      .select("id, display_name, email")
      .order("display_name")
      .limit(100)
      .then(({ data }) =>
        setDirectory(
          (data ?? []).map((row) => ({
            id: row.id,
            name: row.display_name ?? row.email ?? "Player",
            email: row.email,
          })),
        ),
      );
  }, []);

  const addPlayer = (entry?: DirectoryEntry) => {
    setPlayers((prev) => {
      if (prev.length >= GAME_SETTINGS.MAX_PLAYERS) return prev;
      const index = prev.length;
      return renumber([
        ...prev,
        {
          number: index + 1,
          name: entry?.name ?? `Player ${index + 1}`,
          color: PAWN_COLORS[index % PAWN_COLORS.length]!,
          email: entry?.email ?? null,
          userId: entry?.id ?? null,
          isOnline: Boolean(entry?.email),
        },
      ]);
    });
  };

  const removePlayer = (index: number) =>
    setPlayers((prev) => (prev.length <= GAME_SETTINGS.MIN_PLAYERS ? prev : renumber(prev.filter((_, i) => i !== index))));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
          ← Main menu
        </Link>
        <SoundControls />
      </div>
      <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-tight text-gradient-gold">
        New game
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Roll physical dice, enter the value, and answer intellectual-property questions to travel the
        board. {bankSize > 0 ? `${bankSize} questions loaded.` : "Loading question bank…"}
      </p>
      {bankError && (
        <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">
          {bankError}
        </p>
      )}

      <section className="mt-8 rounded-2xl border border-border bg-card/80 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="game-name">Session name</Label>
            <Input id="game-name" value={gameName} onChange={(e) => setGameName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="board-size">Board size — N houses</Label>
            <select
              id="board-size"
              value={boardSize}
              onChange={(e) => setBoardSize(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {BOARD_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} houses · {housesPerSide(size)} per side
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              4 corners (START, CLUB, BAR, JAIL) plus {housesPerSide(boardSize)} houses on each side.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-secondary/50 p-3">
          <div>
            <p className="text-sm font-bold text-foreground">Prioritise golden dataset</p>
            <p className="text-xs text-muted-foreground">
              Curated golden questions are served first whenever one fits the square.
            </p>
          </div>
          <Switch checked={goldenFirst} onCheckedChange={setGoldenFirst} aria-label="Prioritise golden dataset" />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="font-display text-sm font-black uppercase tracking-widest text-foreground">
            Players ({players.length}/{GAME_SETTINGS.MAX_PLAYERS})
          </h2>
          <Button size="sm" variant="secondary" onClick={() => addPlayer()} disabled={players.length >= GAME_SETTINGS.MAX_PLAYERS}>
            Add custom player
          </Button>
        </div>

        <ul className="mt-3 space-y-2">
          {players.map((p, index) => (
            <li key={index} className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                aria-label={`Colour for player ${p.number}`}
                value={p.color}
                onChange={(e) =>
                  setPlayers((prev) => prev.map((x, i) => (i === index ? { ...x, color: e.target.value } : x)))
                }
                className="h-9 w-9 cursor-pointer rounded-md border border-border bg-background"
              />
              <div className="min-w-[10rem] flex-1">
                <Input
                  aria-label={`Name for player ${p.number}`}
                  value={p.name}
                  onChange={(e) =>
                    setPlayers((prev) => prev.map((x, i) => (i === index ? { ...x, name: e.target.value } : x)))
                  }
                />
                {p.email && <p className="mt-0.5 truncate text-[0.62rem] text-muted-foreground">{p.email}</p>}
              </div>
              <label className="flex shrink-0 items-center gap-2 text-[0.66rem] uppercase tracking-widest text-muted-foreground">
                {p.isOnline ? "Online" : "Offline"}
                <Switch
                  checked={Boolean(p.isOnline)}
                  disabled={!p.email}
                  aria-label={`${p.name} plays online`}
                  onCheckedChange={(checked) =>
                    setPlayers((prev) => prev.map((x, i) => (i === index ? { ...x, isOnline: checked } : x)))
                  }
                />
              </label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removePlayer(index)}
                disabled={players.length <= GAME_SETTINGS.MIN_PLAYERS}
                aria-label={`Remove ${p.name}`}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>

        {directory.length > 0 && (
          <div className="mt-5 rounded-xl border border-border bg-background/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Add from registered users
            </p>
            <p className="mt-1 text-[0.66rem] text-muted-foreground">
              Registered players can be switched to online play and get their own device view. Custom players
              stay offline.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {directory.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => addPlayer(entry)}
                  disabled={players.length >= GAME_SETTINGS.MAX_PLAYERS}
                  className={cn(
                    "rounded-full border border-border px-3 py-1 text-xs text-foreground transition-colors hover:border-gold",
                    players.length >= GAME_SETTINGS.MAX_PLAYERS && "opacity-40",
                  )}
                >
                  + {entry.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            size="lg"
            onClick={() =>
              onStart(
                gameName.trim() || "Rakuten FLIP Workshop",
                players.map((p, i) => ({ ...p, number: i + 1, name: p.name.trim() || `Player ${i + 1}` })),
                { boardSize, goldenFirst },
              )
            }
          >
            Start game
          </Button>
          {hasStoredGame && (
            <Button size="lg" variant="secondary" onClick={onResume}>
              Load saved game
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
