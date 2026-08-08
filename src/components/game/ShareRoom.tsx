import { useState } from "react";

import { Button } from "@/components/ui/button";
import { roomUrl } from "@/services/roomService";

/** Share the game-room link over WhatsApp, Teams, email or the clipboard. */
export function ShareRoom({ code, gameName }: { code: string; gameName: string }) {
  const [copied, setCopied] = useState(false);
  const url = roomUrl(code);
  const text = `Join my WHIP session "${gameName}" — room ${code}: ${url}`;

  return (
    <section className="rounded-2xl border border-gold/50 bg-card/85 p-3">
      <h3 className="font-display text-[0.68rem] font-black uppercase tracking-[0.2em] text-gold">
        Game room {code}
      </h3>
      <p className="mt-1 break-all text-[0.68rem] text-muted-foreground">{url}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            void navigator.clipboard.writeText(url).then(() => setCopied(true));
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button size="sm" variant="secondary" asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        </Button>
        <Button size="sm" variant="secondary" asChild>
          <a
            href={`https://teams.microsoft.com/share?href=${encodeURIComponent(url)}&msgText=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noreferrer"
          >
            Teams
          </a>
        </Button>
        <Button size="sm" variant="secondary" asChild>
          <a href={`mailto:?subject=${encodeURIComponent(`WHIP session ${code}`)}&body=${encodeURIComponent(text)}`}>
            Email
          </a>
        </Button>
      </div>
    </section>
  );
}
