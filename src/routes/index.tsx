import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { GameBoard } from "@/components/game/GameBoard";
import { QuestionCard } from "@/components/game/QuestionCard";
import { PresenterPanel } from "@/components/game/PresenterPanel";
import { SetupScreen } from "@/components/game/SetupScreen";
import { Button } from "@/components/ui/button";
import { loadStoredState, useGameEngine } from "@/game/useGameEngine";
import { cn } from "@/lib/utils";

const TITLE = "Business of IP — Presenter-Led IP Board Game";
const DESCRIPTION =
  "Run intellectual-property awareness workshops with a presenter-controlled board game: physical dice, timed IP questions, live scoring and session analytics.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

const TONE_CLASS: Record<string, string> = {
  info: "border-border bg-secondary",
  success: "border-success/50 bg-success/10",
  danger: "border-destructive/50 bg-destructive/10",
  warning: "border-gold/60 bg-gold/10",
};

function Index() {
  const engine = useGameEngine();
  const { state } = engine;
  const [hasStored, setHasStored] = useState(false);

  useEffect(() => {
    setHasStored(loadStoredState() !== null);
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen bg-background">
        <SetupScreen
          bankSize={engine.bank.length}
          bankError={engine.bankError}
          hasStoredGame={hasStored}
          onResume={() => engine.resumeStored()}
          onStart={(name, players) => void engine.startGame(name, players)}
        />
      </div>
    );
  }

  const activePosition = engine.currentPlayer?.position ?? null;
  const isFinished = state.phase === "WINNER" || state.phase === "GAME_COMPLETE";
  const ranked = [...state.players].sort(
    (a, b) => b.laps - a.laps || b.correct - a.correct || b.position - a.position,
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-2 px-4 py-3">
          <h1 className="font-display text-lg font-black uppercase tracking-widest text-foreground">
            Business of IP
          </h1>
          <nav className="flex gap-4 text-sm">
            <Link to="/history" className="text-muted-foreground underline hover:text-foreground">
              History
            </Link>
            <Link to="/questions" className="text-muted-foreground underline hover:text-foreground">
              Question bank
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <GameBoard
            players={state.players}
            currentPlayerId={state.currentPlayerId}
            activePosition={activePosition}
          />

          {state.saveError && (
            <p className="rounded-lg border border-gold/60 bg-gold/10 p-3 text-sm text-foreground">
              {state.saveError}
            </p>
          )}

          {state.notice && (
            <div className={cn("rounded-xl border p-4", TONE_CLASS[state.notice.tone])}>
              <p className="font-display text-base font-black uppercase tracking-wide text-foreground">
                {state.notice.title}
              </p>
              {state.notice.body && (
                <p className="mt-1 text-sm text-muted-foreground">{state.notice.body}</p>
              )}
              {(state.phase === "SPECIAL_EVENT" || state.phase === "NO_QUESTION") && (
                <Button size="sm" className="mt-3" onClick={engine.continuePlay}>
                  Continue to next player
                </Button>
              )}
            </div>
          )}

          {state.phase === "PAUSED" && (
            <div className="rounded-xl border border-border bg-secondary p-4">
              <p className="font-display text-base font-black uppercase text-foreground">Game paused</p>
              <Button size="sm" className="mt-3" onClick={engine.resume}>
                Resume game
              </Button>
            </div>
          )}

          {state.currentQuestion && !isFinished && (
            <QuestionCard
              question={state.currentQuestion}
              phase={state.phase}
              timeRemaining={state.timeRemaining}
              selectedOption={state.selectedOption}
              wasTimeout={state.wasTimeout}
              playerName={engine.currentPlayer?.name ?? ""}
              playerColor={engine.currentPlayer?.color ?? "#000"}
              onSelect={engine.selectAnswer}
              onTick={engine.tick}
              onTimeout={engine.timeout}
              onContinue={engine.continueAfterReveal}
              onDifferentQuestion={engine.differentQuestion}
              onSkip={engine.skipQuestion}
            />
          )}

          {isFinished && (
            <div className="rounded-xl border border-gold/60 bg-gold/10 p-5">
              <p className="font-display text-2xl font-black uppercase tracking-wide text-foreground">
                {state.phase === "WINNER" ? "We have a winner!" : "Game complete"}
              </p>
              <ol className="mt-3 space-y-1 text-sm">
                {ranked.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-2 text-foreground">
                    <span className="w-5 font-display font-black text-muted-foreground">{i + 1}</span>
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {p.correct}✓ · {p.incorrect}✗ · {p.timeouts} timeouts · lap {p.laps}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                {state.phase === "WINNER" && (
                  <>
                    <Button onClick={() => void engine.endGame()}>End game &amp; save results</Button>
                    <Button variant="secondary" onClick={engine.continuePlay}>
                      Keep playing
                    </Button>
                  </>
                )}
                {state.phase === "GAME_COMPLETE" && (
                  <>
                    <Button onClick={engine.discard}>New game</Button>
                    <Button variant="secondary" asChild>
                      <Link to="/history">View analytics</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <PresenterPanel
          state={state}
          currentPlayer={engine.currentPlayer}
          undoCount={engine.undoCount}
          questionsRemaining={engine.questionsRemaining}
          onDice={engine.move}
          onSelectPlayer={engine.selectPlayer}
          onManualMove={engine.manualMove}
          onRenamePlayer={engine.renamePlayer}
          onRenameGame={engine.renameGame}
          onUndo={() => engine.undo()}
          onEndTurn={engine.endTurn}
          onPause={engine.pause}
          onResume={engine.resume}
          onEndGame={() => void engine.endGame()}
          onResetUsed={engine.resetUsedQuestions}
          onDiscard={engine.discard}
        />
      </main>
    </div>
  );
}
