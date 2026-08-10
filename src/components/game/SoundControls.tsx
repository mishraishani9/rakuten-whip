import { useEffect, useState } from "react";

import { gameAudio } from "@/game/audio";
import { cn } from "@/lib/utils";

/**
 * Mute toggle + background-music volume slider. Available on every screen
 * (launch, home, setup, gameplay, player room).
 */
export function SoundControls({
  className,
  onEnabledChange,
}: {
  className?: string;
  onEnabledChange?: (enabled: boolean) => void;
}) {
  const [on, setOn] = useState(() => gameAudio.isEnabled());
  const [volume, setVolume] = useState(() => gameAudio.getVolume());

  useEffect(() => {
    gameAudio.setEnabled(on);
    onEnabledChange?.(on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        aria-label={on ? "Mute sound" : "Unmute sound"}
        onClick={() => {
          gameAudio.unlock();
          setOn((v) => !v);
        }}
        className="rounded-full border border-gold/60 px-2.5 py-1 text-xs font-black uppercase tracking-widest text-gold"
      >
        {on ? "🔊 Sound" : "🔇 Muted"}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(volume * 100)}
        aria-label="Background music volume"
        onChange={(e) => {
          const next = Number(e.target.value) / 100;
          setVolume(next);
          gameAudio.unlock();
          gameAudio.setVolume(next);
        }}
        className="h-1 w-20 accent-[var(--gold)]"
      />
    </div>
  );
}