import { useState } from "react";

import { Button } from "@/components/ui/button";
import { gameAudio } from "@/game/audio";
import { cn } from "@/lib/utils";

const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

/** On-screen dice for online players. Presenter-driven turns gate the button. */
export function DiceRoller({
  disabled,
  onRolled,
  hint,
}: {
  disabled: boolean;
  onRolled: (value: number) => void;
  hint?: string;
}) {
  const [face, setFace] = useState(1);
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    if (disabled || rolling) return;
    setRolling(true);
    gameAudio.unlock();
    gameAudio.dice();
    let ticks = 0;
    const id = window.setInterval(() => {
      ticks++;
      setFace(1 + Math.floor(Math.random() * 6));
      if (ticks >= 10) {
        window.clearInterval(id);
        const value = 1 + Math.floor(Math.random() * 6);
        setFace(value);
        setRolling(false);
        onRolled(value);
      }
    }, 70);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={roll}
        disabled={disabled || rolling}
        aria-label="Roll the dice"
        className={cn(
          "grid h-20 w-20 place-items-center rounded-2xl border-2 border-gold bg-card text-5xl leading-none text-gold",
          (disabled || rolling) && "opacity-45",
          !disabled && !rolling && "shadow-gold-glow hover:scale-105",
        )}
      >
        {FACES[face - 1]}
      </button>
      <Button size="sm" onClick={roll} disabled={disabled || rolling}>
        {rolling ? "Rolling…" : "Roll dice"}
      </Button>
      {hint && <p className="max-w-[14rem] text-center text-[0.66rem] text-muted-foreground">{hint}</p>}
    </div>
  );
}
