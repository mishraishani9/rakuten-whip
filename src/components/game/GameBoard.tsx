import { BOARD_POSITIONS, squareLabel, type BoardPosition } from "@/game/config";
import type { PlayerState } from "@/game/types";
import { cn } from "@/lib/utils";

/** Perimeter coordinates for a 7x7 CSS grid: 24 squares clockwise from top-left. */
const GRID_CELLS = (() => {
  const cells: { row: number; col: number }[] = [];
  for (let c = 1; c <= 7; c++) cells.push({ row: 1, col: c });
  for (let r = 2; r <= 7; r++) cells.push({ row: r, col: 7 });
  for (let c = 6; c >= 1; c--) cells.push({ row: 7, col: c });
  for (let r = 6; r >= 2; r--) cells.push({ row: r, col: 1 });
  return cells;
})();

const THEME_ACCENT: Record<string, string> = {
  Patent: "bg-square-patent",
  Trademark: "bg-square-trademark",
  "IP Fundamentals": "bg-square-fundamentals",
  "Prior Art": "bg-square-priorart",
  Inventorship: "bg-square-inventorship",
  Patentability: "bg-square-patentability",
  "Trade Secrets": "bg-square-tradesecrets",
  "SEPs & Standards": "bg-square-seps",
  Copyright: "bg-square-copyright",
};

function SquareBody({ square }: { square: BoardPosition }) {
  if (square.type === "question") {
    return (
      <>
        <span className={cn("block h-2 w-full rounded-t-sm", THEME_ACCENT[square.theme])} />
        <span className="mt-1 block text-[0.6rem] font-semibold leading-tight text-foreground">
          {square.theme}
        </span>
        <span className="mt-auto block text-[0.55rem] uppercase tracking-wide text-muted-foreground">
          {square.difficulty}
        </span>
      </>
    );
  }
  if (square.type === "bonus") {
    return (
      <span className="flex h-full flex-col items-center justify-center text-center">
        <span className="text-lg font-black text-accent">★</span>
        <span className="text-[0.6rem] font-bold uppercase text-foreground">Bonus +{square.bonusMove}</span>
      </span>
    );
  }
  if (square.type === "event") {
    return (
      <span className="flex h-full items-center justify-center text-3xl font-black text-accent">?</span>
    );
  }
  return (
    <span className="flex h-full flex-col items-center justify-center text-center">
      <span className="text-xs font-black uppercase tracking-widest text-foreground">{square.label}</span>
    </span>
  );
}

export function GameBoard({
  players,
  currentPlayerId,
  activePosition,
}: {
  players: PlayerState[];
  currentPlayerId: string;
  activePosition: number | null;
}) {
  return (
    <div className="board-surface relative mx-auto aspect-square w-full max-w-[min(78vh,860px)] rounded-2xl p-2 shadow-board">
      <div className="grid h-full w-full grid-cols-7 grid-rows-7 gap-1">
        {BOARD_POSITIONS.map((square, index) => {
          const cell = GRID_CELLS[index]!;
          const occupants = players.filter((p) => p.position === square.position);
          const isActive = activePosition === square.position;
          return (
            <div
              key={square.position}
              style={{ gridRow: cell.row, gridColumn: cell.col }}
              aria-label={`Position ${square.position}: ${squareLabel(square)}`}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-md border border-border bg-card p-1 transition-shadow",
                square.type !== "question" && "bg-secondary",
                isActive && "ring-2 ring-accent shadow-glow",
              )}
            >
              <span className="absolute right-1 top-0.5 text-[0.5rem] font-semibold text-muted-foreground">
                {square.position}
              </span>
              <SquareBody square={square} />
              {occupants.length > 0 && (
                <span className="absolute bottom-0.5 left-0.5 flex flex-wrap gap-0.5">
                  {occupants.map((p) => (
                    <span
                      key={p.id}
                      title={p.name}
                      className={cn(
                        "h-3 w-3 rounded-full border border-background",
                        p.id === currentPlayerId && "animate-pawn-pop ring-2 ring-accent",
                      )}
                      style={{ backgroundColor: p.color }}
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}

        <div
          style={{ gridRow: "2 / 7", gridColumn: "2 / 7" }}
          className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary/60 p-6 text-center"
        >
          <p className="font-display text-3xl font-black uppercase tracking-[0.2em] text-foreground">
            Business of IP
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Intellectual Property Awareness Game</p>
          <div className="mt-6 grid grid-cols-3 gap-2 text-[0.6rem] uppercase tracking-wide text-muted-foreground">
            {Object.keys(THEME_ACCENT).map((theme) => (
              <span key={theme} className="flex items-center gap-1">
                <span className={cn("h-2 w-2 rounded-full", THEME_ACCENT[theme])} />
                {theme}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}