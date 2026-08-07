import { useEffect } from "react";
import type { Question } from "@/game/types";
import { GAME_SETTINGS } from "@/game/config";
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
  onSelect,
  onTick,
  onTimeout,
  onContinue,
  onDifferentQuestion,
  onSkip,
}: {
  question: Question;
  phase: string;
  timeRemaining: number;
  selectedOption: "A" | "B" | "C" | "D" | null;
  wasTimeout: boolean;
  playerName: string;
  playerColor: string;
  onSelect: (option: "A" | "B" | "C" | "D") => void;
  onTick: () => void;
  onTimeout: () => void;
  onContinue: () => void;
  onDifferentQuestion: () => void;
  onSkip: () => void;
}) {
  const isActive = phase === "QUESTION_ACTIVE";
  const revealed = phase === "ANSWER_REVEALED";

  useEffect(() => {
    if (!isActive) return;
    const id = window.setInterval(() => onTick(), 1000);
    return () => window.clearInterval(id);
  }, [isActive, onTick]);

  useEffect(() => {
    if (isActive && timeRemaining <= 0) onTimeout();
  }, [isActive, timeRemaining, onTimeout]);

  const progress = (timeRemaining / GAME_SETTINGS.QUESTION_TIME_SECONDS) * 100;
  const options: Record<(typeof LETTERS)[number], string> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: playerColor }} />
          <span className="text-sm font-semibold text-foreground">{playerName}</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {question.theme} · {question.difficulty}
          </span>
        </div>
        <span
          className={cn(
            "font-display text-2xl font-black tabular-nums",
            timeRemaining <= 5 ? "text-destructive" : "text-foreground",
          )}
        >
          {isActive ? `${timeRemaining}s` : wasTimeout ? "0s" : "—"}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", timeRemaining <= 5 ? "bg-destructive" : "bg-gold")}
          style={{ width: `${isActive ? progress : 0}%` }}
        />
      </div>

      <h2 className="mt-4 text-lg font-semibold leading-snug text-foreground">{question.question}</h2>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {LETTERS.map((letter) => {
          const isCorrect = question.correct_option === letter;
          const isSelected = selectedOption === letter;
          const showState = phase === "ANSWER_SELECTED" || revealed;
          return (
            <button
              key={letter}
              type="button"
              disabled={!isActive}
              onClick={() => onSelect(letter)}
              className={cn(
                "flex items-start gap-3 rounded-lg border border-border bg-background p-3 text-left text-sm transition-colors",
                isActive && "hover:border-gold hover:bg-secondary",
                showState && isCorrect && "border-success bg-success/15 animate-answer-blink",
                showState && isSelected && !isCorrect && "border-destructive bg-destructive/15",
              )}
            >
              <span className="font-display text-sm font-black text-muted-foreground">{letter}</span>
              <span className="text-foreground">{options[letter]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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
          </>
        )}
      </div>
    </div>
  );
}