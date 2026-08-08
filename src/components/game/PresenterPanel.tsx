import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { squareLabel, squareAt, GAME_SETTINGS } from "@/game/config";
import type { GameState, PlayerState } from "@/game/types";
import { cn } from "@/lib/utils";

const DICE = [1, 2, 3, 4, 5, 6];

export function PresenterPanel({
  state,
  currentPlayer,
  undoCount,
  questionsRemaining,
  bankReady,
  onDice,
  onSelectPlayer,
  onManualMove,
  onRenamePlayer,
  onRenameGame,
  onUndo,
  onEndTurn,
  onPause,
  onResume,
  onEndGame,
  onResetUsed,
  onDiscard,
}: {
  state: GameState;
  currentPlayer: PlayerState | null;
  undoCount: number;
  questionsRemaining: number;
  bankReady: boolean;
  onDice: (value: number) => void;
  onSelectPlayer: (id: string) => void;
  onManualMove: (id: string, position: number) => void;
  onRenamePlayer: (id: string, name: string) => void;
  onRenameGame: (name: string) => void;
  onUndo: () => void;
  onEndTurn: () => void;
  onPause: () => void;
  onResume: () => void;
  onEndGame: () => void;
  onResetUsed: () => void;
  onDiscard: () => void;
}) {
  const [manualTarget, setManualTarget] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);

  const diceDisabled =
    !bankReady ||
    (state.phase !== "PLAYER_TURN" && state.phase !== "READY" && state.phase !== "SPECIAL_EVENT");
  const paused = state.phase === "PAUSED";

  return (
    <aside className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Presenter control</p>
            <input
              value={state.gameName}
              onChange={(e) => onRenameGame(e.target.value)}
              className="w-full border-none bg-transparent p-0 font-display text-xl font-black text-foreground outline-none"
              aria-label="Game name"
            />
          </div>
          <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-muted-foreground">
            Turn {state.turnNumber}
          </span>
        </div>

        {currentPlayer && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary p-3">
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: currentPlayer.color }} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{currentPlayer.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                Position {currentPlayer.position} · {squareLabel(squareAt(currentPlayer.position))}
                {currentPlayer.inJail ? " · In Jail" : ""}
              </p>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {bankReady ? "Enter physical dice value" : "Loading question bank…"}
        </p>
        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {DICE.map((value) => (
            <button
              key={value}
              type="button"
              disabled={diceDisabled || paused}
              onClick={() => onDice(value)}
              className={cn(
                "aspect-square rounded-lg border border-border bg-background font-display text-lg font-black text-foreground transition-colors",
                !diceDisabled && !paused && "hover:border-gold hover:bg-secondary",
                (diceDisabled || paused) && "opacity-40",
              )}
            >
              {value}
            </button>
          ))}
        </div>
        {state.lastDice !== null && (
          <p className="mt-2 text-xs text-muted-foreground">Last dice: {state.lastDice}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={paused ? onResume : onPause}>
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button size="sm" variant="outline" onClick={onEndTurn}>
            Next player
          </Button>
          <Button size="sm" variant="outline" onClick={onUndo} disabled={undoCount === 0}>
            Undo ({undoCount}/{GAME_SETTINGS.MAX_ROLLBACKS})
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-black uppercase tracking-widest text-foreground">Players</h3>
          <span className="text-xs text-muted-foreground">{questionsRemaining} questions left</span>
        </div>
        <ul className="mt-3 space-y-1.5">
          {state.players.map((p) => (
            <li
              key={p.id}
              className={cn(
                "rounded-lg border border-border p-2",
                p.id === state.currentPlayerId ? "border-gold bg-secondary" : "bg-background",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                {editingId === p.id ? (
                  <form
                    className="flex flex-1 gap-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editName.trim()) onRenamePlayer(p.id, editName.trim());
                      setEditingId(null);
                    }}
                  >
                    <Input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-7 text-xs"
                    />
                    <Button size="sm" type="submit" className="h-7 px-2 text-xs">
                      Save
                    </Button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelectPlayer(p.id)}
                      className="flex-1 truncate text-left text-sm font-semibold text-foreground"
                    >
                      {p.name}
                    </button>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      #{p.position} · {p.correct}✓ {p.incorrect}✗
                    </span>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline"
                      onClick={() => {
                        setEditingId(p.id);
                        setEditName(p.name);
                      }}
                    >
                      edit
                    </button>
                  </>
                )}
              </div>
              {(p.missTurns > 0 || p.inJail || p.completedCircuit) && (
                <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                  {p.inJail && "In jail · "}
                  {p.missTurns > 0 && `Misses ${p.missTurns} turn(s) · `}
                  {p.completedCircuit && "Completed circuit"}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <button
          type="button"
          onClick={() => setShowAdmin((v) => !v)}
          className="font-display text-sm font-black uppercase tracking-widest text-foreground"
        >
          Admin tools {showAdmin ? "−" : "+"}
        </button>
        {showAdmin && (
          <div className="mt-3 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="manual-move" className="text-xs">
                Move current player to position (0–{GAME_SETTINGS.BOARD_SIZE - 1})
              </Label>
              <div className="flex gap-2">
                <Input
                  id="manual-move"
                  inputMode="numeric"
                  value={manualTarget}
                  onChange={(e) => setManualTarget(e.target.value)}
                  className="h-8"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const target = Number(manualTarget);
                    if (!currentPlayer || Number.isNaN(target)) return;
                    if (target < 0 || target >= GAME_SETTINGS.BOARD_SIZE) return;
                    onManualMove(currentPlayer.id, target);
                    setManualTarget("");
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={onResetUsed}>
                Reset used questions
              </Button>
              <Button size="sm" onClick={onEndGame}>
                End game &amp; save
              </Button>
              <Button size="sm" variant="ghost" onClick={onDiscard}>
                Discard session
              </Button>
            </div>
          </div>
        )}
      </section>
    </aside>
  );
}