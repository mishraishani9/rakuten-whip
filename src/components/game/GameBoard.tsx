import {
  BOARD_POSITIONS,
  EVENT_RULES,
  housesPerSide,
  squareLabel,
  type BoardPosition,
} from "@/game/config";
import type { PlayerState } from "@/game/types";
import { cn } from "@/lib/utils";

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

/** Perimeter coordinates for a (perSide+2)² grid, clockwise from top-left. */
function gridCells(boardSize: number) {
  const side = housesPerSide(boardSize) + 2;
  const cells: { row: number; col: number }[] = [];
  for (let c = 1; c <= side; c++) cells.push({ row: 1, col: c });
  for (let r = 2; r <= side; r++) cells.push({ row: r, col: side });
  for (let c = side - 1; c >= 1; c--) cells.push({ row: side, col: c });
  for (let r = side - 1; r >= 2; r--) cells.push({ row: r, col: 1 });
  return { cells, side };
}

function SquareBody({ square }: { square: BoardPosition }) {
  if (square.type === "question") {
    return (
      <>
        <span className={cn("block h-1.5 w-full rounded-full", THEME_ACCENT[square.theme])} />
        <span className="mt-1 block text-[0.58rem] font-bold leading-tight text-foreground">
          {square.theme}
        </span>
        <span className="mt-auto block text-[0.5rem] font-semibold uppercase tracking-widest text-muted-foreground">
          {square.difficulty}
        </span>
      </>
    );
  }
  if (square.type === "bonus") {
    return (
      <span className="flex h-full flex-col items-center justify-center text-center">
        <span className="text-xl font-black text-gold drop-shadow-[0_0_10px_rgba(255,200,80,0.8)]">★</span>
        <span className="text-[0.58rem] font-black uppercase text-gold">+{square.bonusMove}</span>
      </span>
    );
  }
  if (square.type === "penalty") {
    return (
      <span className="flex h-full flex-col items-center justify-center text-center">
        <span className="text-xl font-black text-destructive drop-shadow-[0_0_10px_rgba(255,80,80,0.8)]">⚠</span>
        <span className="text-[0.58rem] font-black uppercase text-destructive">−{square.penaltyMove}</span>
      </span>
    );
  }
  if (square.type === "event") {
    return (
      <span className="flex h-full items-center justify-center">
        <span className="text-3xl font-black text-accent drop-shadow-[0_0_14px_rgba(90,170,255,0.95)]">?</span>
      </span>
    );
  }
  if (square.type === "finish") {
    return (
      <span className="flex h-full flex-col items-center justify-center text-center">
        <span className="text-lg">⚑</span>
        <span className="text-[0.6rem] font-black uppercase tracking-widest text-gold">Finish</span>
      </span>
    );
  }
  return (
    <span className="flex h-full flex-col items-center justify-center text-center">
      <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-foreground">
        {square.label}
      </span>
      {square.type === "start" && <span className="mt-0.5 text-[0.85rem] text-gold">▶▶</span>}
    </span>
  );
}

export function GameBoard({
  players,
  currentPlayerId,
  activePosition,
  board = BOARD_POSITIONS,
  timeRemaining,
  timerTotal,
  timerActive,
}: {
  players: PlayerState[];
  currentPlayerId: string;
  activePosition: number | null;
  board?: BoardPosition[];
  timeRemaining?: number;
  timerTotal?: number;
  timerActive?: boolean;
}) {
  const { cells, side } = gridCells(board.length);
  const inner = Math.max(2, side - 1);
  const total = timerTotal ?? 30;
  const left = timeRemaining ?? total;

  return (
    <div className="relative mx-auto w-full max-w-[min(72vh,820px)] [perspective:2200px]">
      <div className="board-surface board-isometric relative aspect-square w-full rounded-[1.75rem] p-2 shadow-board">
        <div
          className="grid h-full w-full gap-1"
          style={{
            gridTemplateColumns: `repeat(${side}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${side}, minmax(0, 1fr))`,
          }}
        >
          {board.map((square, index) => {
            const cell = cells[index]!;
            const occupants = players.filter((p) => p.position === square.position);
            const isActive = activePosition === square.position;
            return (
              <div
                key={square.position}
                style={{ gridRow: cell.row, gridColumn: cell.col }}
                aria-label={squareLabel(square)}
                className={cn(
                  "tile-3d relative flex flex-col overflow-visible rounded-md border border-border bg-card/85 p-1 backdrop-blur-sm",
                  square.type !== "question" && "bg-secondary/85",
                  square.type === "event" && "border-accent/70",
                  square.type === "bonus" && "border-gold/70",
                  square.type === "penalty" && "border-destructive/70",
                  square.type === "finish" && "border-gold bg-gold/15",
                  isActive && "ring-2 ring-gold shadow-gold-glow",
                )}
              >
                <SquareBody square={square} />
                {occupants.length > 0 && (
                  <span className="pawn-3d pointer-events-none absolute inset-x-0 -top-1 flex flex-wrap items-center justify-center gap-0.5">
                    {occupants.map((p) => (
                      <span
                        key={p.id}
                        title={p.name}
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border-2 border-background text-[0.55rem] font-black text-background shadow-[0_6px_14px_-4px_rgba(0,0,0,0.9)]",
                          p.id === currentPlayerId && "animate-pawn-pop ring-2 ring-gold",
                        )}
                        style={{ backgroundColor: p.color }}
                      >
                        {p.number}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            );
          })}

          <div
            style={{ gridRow: `2 / ${inner + 1}`, gridColumn: `2 / ${inner + 1}` }}
            className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary/45 p-4 text-center"
          >
            <span className="ip-graffiti pointer-events-none absolute inset-0" aria-hidden="true" />
            <p className="text-gradient-gold font-display text-2xl font-black uppercase tracking-[0.22em] sm:text-3xl">
              WHIP
            </p>
            <p className="mt-1 max-w-[22rem] text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
              World &amp; Highlights in Intellectual Property
            </p>

            {timerActive && (
              <div className="mt-3 w-full max-w-[16rem]">
                <p
                  className={cn(
                    "font-display text-4xl font-black tabular-nums",
                    left <= 10 ? "animate-tick-pulse text-destructive" : "text-gold",
                  )}
                >
                  {left}s
                </p>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-background/60">
                  <div
                    className={cn("h-full rounded-full transition-all", left <= 10 ? "bg-destructive" : "bg-accent")}
                    style={{ width: `${(left / total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-3 grid w-full max-w-[26rem] gap-1 text-left text-[0.6rem] leading-tight text-muted-foreground">
              <p className="font-display text-[0.62rem] font-black uppercase tracking-widest text-foreground">
                “?” square — outcome by the dice you rolled
              </p>
              {Object.entries(EVENT_RULES).map(([dice, rule]) => (
                <p key={dice}>
                  <span className="font-black text-accent">{dice}</span> · {rule.label}
                </p>
              ))}
              <p className="mt-1 font-display text-[0.62rem] font-black uppercase tracking-widest text-foreground">
                ★ Bonus &amp; ⚠ Penalty
              </p>
              <p>★ jumps you forward 3–4 houses. ⚠ pushes you back 2–3 houses.</p>
              <p>Wrong answer or timeout: your pawn recedes to where it stood before the roll.</p>
              <p>Play runs clockwise from START ▶ to the ⚑ FINISH line.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
