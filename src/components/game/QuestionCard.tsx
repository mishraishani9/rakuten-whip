import { useEffect, useRef } from "react";
import type { Question } from "@/game/types";
import { GAME_SETTINGS } from "@/game/config";
import { gameAudio } from "@/game/audio";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const LETTERS = ["A", "B", "C", "D"] as const;

export function QuestionCard({
  question,
  phase,
  timeRemaining,
  selectedOption,
  wasTimeout,
  playerName,
  playerColor,
  soundOn,
  onSelect,
  onTick,
  onTimeout,
  onContinue,
  onDifferentQuestion,
  onSkip,
  onFlag,
  variant = "presenter",
  canAnswer = true,
}: {
  question: Question;
  phase: string;
  timeRemaining: number;
  selectedOption: "A" | "B" | "C" | "D" | null;
  wasTimeout: boolean;
  playerName: string;
  playerColor: string;
  soundOn: boolean;
  onSelect: (option: "A" | "B" | "C" | "D") => void;
  onTick?: () => void;
  onTimeout?: () => void;
  onContinue?: () => void;
  onDifferentQuestion?: () => void;
  onSkip?: () => void;
  /** Staff-only: flag this question for audit (removes it from gameplay). */
  onFlag?: () => void;
  /** "player" renders the read-only online view: answers only, no presenter tools. */
  variant?: "presenter" | "player";
  canAnswer?: boolean;
}) {
  const isActive = phase === "QUESTION_ACTIVE";
  const revealed = phase === "ANSWER_REVEALED";
  const revealSoundPlayed = useRef(false);

  useEffect(() => {
    if (!isActive || !onTick) return;
    const id = window.setInterval(() => onTick(), 1000);
    return () => window.clearInterval(id);
  }, [isActive, onTick]);

  useEffect(() => {
    if (isActive && soundOn && timeRemaining > 0) gameAudio.tick(timeRemaining);
  }, [isActive, soundOn, timeRemaining]);

  useEffect(() => {
    if (isActive && timeRemaining <= 0) onTimeout?.();
  }, [isActive, timeRemaining, onTimeout]);

  useEffect(() => {
    if (!revealed) {
      revealSoundPlayed.current = false;
      return;
    }
    if (revealSoundPlayed.current || !soundOn) return;
    revealSoundPlayed.current = true;
    if (wasTimeout) gameAudio.timeUp();
    else if (selectedOption === question.correct_option) gameAudio.correct();
    else gameAudio.wrong();
  }, [revealed, soundOn, wasTimeout, selectedOption, question.correct_option]);

  const progress = (timeRemaining / GAME_SETTINGS.QUESTION_TIME_SECONDS) * 100;
  const options: Record<(typeof LETTERS)[number], string> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
  };

  return (
    <section className="stage-backdrop relative overflow-hidden rounded-2xl border border-border p-5">
      <span className="smoke-veil pointer-events-none absolute -inset-10" aria-hidden="true" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: playerColor }} />
            <span className="text-sm font-bold text-foreground">{playerName}</span>
            <span className="rounded-full border border-border bg-secondary/70 px-2 py-0.5 text-xs text-muted-foreground">
              {question.theme} · {question.difficulty}
            </span>
          </div>
          <span
            className={cn(
              "font-display text-3xl font-black tabular-nums",
              isActive && timeRemaining <= 10 ? "animate-tick-pulse text-destructive" : "text-gold",
            )}
          >
            {isActive ? `${timeRemaining}s` : wasTimeout ? "0s" : "—"}
          </span>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-background/70">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              timeRemaining <= 10 ? "bg-destructive" : "bg-accent",
            )}
            style={{ width: `${isActive ? progress : 0}%` }}
          />
        </div>

        <div className="lozenge-shell mt-5 px-8 py-5">
          <h2 className="text-center text-base font-semibold leading-snug text-foreground sm:text-lg">
            {question.question}
          </h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {LETTERS.map((letter) => {
            const isCorrect = question.correct_option === letter;
            const isSelected = selectedOption === letter;
            const showState = phase === "ANSWER_SELECTED" || revealed;
            return (
              <button
                key={letter}
                type="button"
                disabled={!isActive || !canAnswer}
                onClick={() => onSelect(letter)}
                className={cn(
                  "lozenge flex items-center gap-3 px-6 py-3 text-left text-sm",
                  isActive && canAnswer && "hover:scale-[1.02] hover:brightness-125",
                  showState && isCorrect && "animate-answer-blink !bg-[linear-gradient(180deg,oklch(0.62_0.18_150),oklch(0.4_0.14_150))]",
                  showState && isSelected && !isCorrect && "!bg-[linear-gradient(180deg,oklch(0.58_0.22_20),oklch(0.36_0.16_20))]",
                )}
              >
                <span className="font-display text-base font-black text-gold">{letter}</span>
                <span className="text-foreground">{options[letter]}</span>
              </button>
            );
          })}
        </div>

        {variant === "presenter" && (
        <div className="mt-5 flex flex-wrap gap-2">
          {revealed ? (
            <Button onClick={onContinue}>Continue</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={onTimeout} disabled={!isActive}>
                Mark as time up
              </Button>
              <Button variant="outline" onClick={onDifferentQuestion} disabled={!isActive}>
                Different question
              </Button>
              <Button variant="ghost" onClick={onSkip} disabled={!isActive}>
                Skip question
              </Button>
              {onFlag && (
                <Button variant="ghost" className="text-destructive" onClick={onFlag}>
                  ⚑ Flag for audit
                </Button>
              )}
            </>
          )}
        </div>
        )}
      </div>
    </section>
  );
}
