import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { GameBoard } from "@/components/game/GameBoard";
import { QuestionCard } from "@/components/game/QuestionCard";
import { PresenterPanel } from "@/components/game/PresenterPanel";
import { SetupScreen } from "@/components/game/SetupScreen";
import { Button } from "@/components/ui/button";
import { GAME_SETTINGS } from "@/game/config";
import { gameAudio } from "@/game/audio";
import { loadStoredState, useGameEngine } from "@/game/useGameEngine";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const TITLE = "Play WHIP — Presenter-Led IP Quiz Board Game";
const DESCRIPTION =
  "Run a WHIP session: dynamic board, physical dice entry, 30-second timed IP questions, bonus and penalty houses, and a live scoreboard.";

export const Route = createFileRoute("/play")({
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
  component: PlayPage,
});

const TONE_CLASS: Record<string, string> = {
  info: "border-border bg-secondary/70",
  success: "border-success/60 bg-success/15",
  danger: "border-destructive/60 bg-destructive/15",
  warning: "border-gold/70 bg-gold/15",
};

function PlayPage() {
  const engine = useGameEngine();
  const auth = useAuth();
  const { state } = engine;
  const [hasStored, setHasStored] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);

  useEffect(() => {
    setHasStored(loadStoredState() !== null);
  }, []);

  useEffect(() => {
    gameAudio.setEnabled(soundOn);
  }, [soundOn]);

  if (!state) {
    return (
      <SetupScreen
        bankSize={engine.bank.length}
        bankError={engine.bankError}
        hasStoredGame={hasStored}
        onResume={() => engine.resumeStored()}
        onStart={(name, players, options) => void engine.startGame(name, players, options)}
      />
    );
  }

  const activePosition = engine.currentPlayer?.position ?? null;
  const isFinished = state.phase === "WINNER" || state.phase === "GAME_COMPLETE";
  const ranked = [...state.players].sort(
    (a, b) => b.position - a.position || b.correct - a.correct || a.incorrect - b.incorrect,
  );
  const timerActive = state.phase === "QUESTION_ACTIVE";

  const openScoreboard = () => {
    engine.pause();
    setScoreboardOpen(true);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="text-gradient-gold font-display text-lg font-black uppercase tracking-[0.2em]">
            WHIP
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => setSoundOn((v) => !v)}
              className="text-muted-foreground underline hover:text-foreground"
            >
              {soundOn ? "Sound on" : "Sound off"}
            </button>
            <Link to="/history" className="text-muted-foreground underline hover:text-foreground">
              History
            </Link>
            <button
              type="button"
              onClick={openScoreboard}
              className="font-display text-sm font-black uppercase tracking-widest text-gold underline"
            >
              Scoreboard
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <GameBoard
            players={state.players}
            currentPlayerId={state.currentPlayerId}
            activePosition={activePosition}
            board={state.board}
            timeRemaining={state.timeRemaining}
            timerTotal={GAME_SETTINGS.QUESTION_TIME_SECONDS}
            timerActive={timerActive}
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
            <div className="rounded-xl border border-border bg-secondary/70 p-4">
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
              soundOn={soundOn}
              onSelect={engine.selectAnswer}
              onTick={engine.tick}
              onTimeout={engine.timeout}
              onContinue={engine.continueAfterReveal}
              onDifferentQuestion={engine.differentQuestion}
              onSkip={engine.skipQuestion}
            />
          )}

          {isFinished && (
            <div className="rounded-xl border border-gold/70 bg-gold/10 p-5">
              <p className="font-display text-2xl font-black uppercase tracking-wide text-foreground">
                {state.phase === "WINNER" ? "⚑ We have a winner!" : "Game complete"}
              </p>
              <ol className="mt-3 space-y-1 text-sm">
                {ranked.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-2 text-foreground">
                    <span className="w-5 font-display font-black text-muted-foreground">{i + 1}</span>
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {p.correct}✓ · {p.incorrect}✗ · {p.timeouts} timeouts · house {p.position + 1}
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
          bankReady={engine.bank.length > 0}
          canManagePlayers={auth.isStaff}
          onDice={engine.move}
          onSelectPlayer={engine.selectPlayer}
          onManualMove={engine.manualMove}
          onRenamePlayer={engine.renamePlayer}
          onRenameGame={engine.renameGame}
          onRemovePlayer={engine.removePlayer}
          onUndo={() => engine.undo()}
          onEndTurn={engine.endTurn}
          onPause={engine.pause}
          onResume={engine.resume}
          onEndGame={() => void engine.endGame()}
          onResetUsed={engine.resetUsedQuestions}
          onDiscard={engine.discard}
        />
      </main>

      {scoreboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur">
          <section className="stage-backdrop w-full max-w-lg overflow-hidden rounded-2xl border border-gold/60 p-6">
            <h2 className="text-gradient-gold font-display text-2xl font-black uppercase tracking-widest">
              Scoreboard
            </h2>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              {state.gameName} · turn {state.turnNumber} · game paused
            </p>
            <ol className="mt-4 space-y-2">
              {ranked.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card/80 px-3 py-2 text-sm"
                >
                  <span className="w-5 font-display font-black text-gold">{i + 1}</span>
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="flex-1 truncate text-foreground">{p.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    H{p.position + 1} · {p.correct}✓ {p.incorrect}✗ {p.timeouts}⏱
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex gap-2">
              <Button
                onClick={() => {
                  setScoreboardOpen(false);
                  engine.resume();
                }}
              >
                Resume game
              </Button>
              <Button variant="secondary" onClick={() => setScoreboardOpen(false)}>
                Close &amp; stay paused
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
