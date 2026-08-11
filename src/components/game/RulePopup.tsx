import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { GAME_SETTINGS } from "@/game/config";
import type { NoticeTone } from "@/game/types";
import { cn } from "@/lib/utils";

const TONE: Record<NoticeTone, string> = {
  info: "border-border bg-card",
  success: "border-success/70 bg-card",
  danger: "border-destructive/70 bg-card",
  warning: "border-gold/80 bg-card",
};

/** Centered rules popup (club / bar / jail / bonus) that stays readable for 15s. */
export function RulePopup({
  title,
  body,
  tone,
  showContinue,
  onContinue,
  onDismiss,
}: {
  title: string;
  body?: string | undefined;
  tone: NoticeTone;
  showContinue: boolean;
  onContinue: () => void;
  onDismiss: () => void;
}) {
  const [seconds, setSeconds] = useState<number>(GAME_SETTINGS.RULE_POPUP_SECONDS);

  useEffect(() => {
    setSeconds(GAME_SETTINGS.RULE_POPUP_SECONDS);
    const id = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [title, body]);

  useEffect(() => {
    if (seconds === 0) onDismiss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-live="assertive"
        className={cn("w-full max-w-lg rounded-2xl border-2 p-6 text-center shadow-2xl", TONE[tone])}
      >
        <p className="font-display text-2xl font-black uppercase tracking-wide text-foreground">{title}</p>
        {body && <p className="mt-3 text-sm text-muted-foreground">{body}</p>}
        <div className="mt-5 flex items-center justify-center gap-3">
          {showContinue && (
            <Button size="sm" onClick={onContinue}>
              Continue to next player
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={onDismiss}>
            Dismiss ({seconds}s)
          </Button>
        </div>
      </div>
    </div>
  );
}