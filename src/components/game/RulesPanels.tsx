import { EVENT_RULES } from "@/game/config";

/** The two rule panels that used to sit inside the board centre. */
export function RulesPanels() {
  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-2xl border border-accent/50 bg-card/85 p-3">
        <h3 className="font-display text-[0.68rem] font-black uppercase tracking-[0.2em] text-accent">
          “?” square — outcome by dice rolled
        </h3>
        <ul className="mt-2 space-y-1 text-[0.66rem] leading-tight text-muted-foreground">
          {Object.entries(EVENT_RULES).map(([dice, rule]) => (
            <li key={dice}>
              <span className="mr-1 inline-grid h-4 w-4 place-items-center rounded-sm bg-accent text-[0.55rem] font-black text-accent-foreground">
                {dice}
              </span>
              <span className="font-bold text-foreground">{rule.label}</span> — {rule.description}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-gold/50 bg-card/85 p-3">
        <h3 className="font-display text-[0.68rem] font-black uppercase tracking-[0.2em] text-gold">
          ★ Bonus &amp; ⚠ Penalty
        </h3>
        <ul className="mt-2 space-y-1 text-[0.66rem] leading-tight text-muted-foreground">
          <li>
            <span className="font-black text-gold">★ Bonus</span> — jump forward 3–4 houses, then resolve the
            new house.
          </li>
          <li>
            <span className="font-black text-destructive">⚠ Penalty</span> — pushed back 2–3 houses.
          </li>
          <li>A wrong answer or a timeout recedes your pawn to where it stood before the roll.</li>
          <li>CLUB: miss one turn. BAR: miss two turns. JAIL: roll 1 or 6 to escape.</li>
          <li>Play runs clockwise from START ▶ to the ⚑ FINISH line.</li>
        </ul>
      </section>
    </div>
  );
}
