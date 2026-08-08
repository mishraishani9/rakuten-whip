import { BOARD_THEMES, DIFFICULTY_TOKEN, THEME_TOKEN, type BoardPosition } from "@/game/config";

/** Colour → topic legend, shown outside the board so houses stay text-free. */
export function BoardLegend({ board }: { board: BoardPosition[] }) {
  const used = new Set(board.filter((s) => s.type === "question").map((s) => s.theme));
  const themes = BOARD_THEMES.filter((t) => used.has(t));

  return (
    <section className="rounded-2xl border border-border bg-card/85 p-3">
      <h3 className="font-display text-[0.68rem] font-black uppercase tracking-[0.2em] text-foreground">
        Topic legend
      </h3>
      <ul className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
        {themes.map((theme) => (
          <li key={theme} className="flex min-w-0 items-center gap-2 text-[0.68rem] text-muted-foreground">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: `var(${THEME_TOKEN[theme]})` }}
            />
            <span className="truncate text-foreground">{theme}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-2 text-[0.62rem] uppercase tracking-widest">
        {(["Easy", "Medium", "Hard"] as const).map((d) => (
          <span key={d} className="flex items-center gap-1 text-muted-foreground">
            <span
              className="grid h-4 w-4 place-items-center rounded-full text-[0.55rem] font-black text-background"
              style={{ backgroundColor: `var(${DIFFICULTY_TOKEN[d]})` }}
            >
              {d[0]}
            </span>
            {d}
          </span>
        ))}
      </div>
    </section>
  );
}
