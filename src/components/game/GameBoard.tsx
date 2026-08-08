import {
  BOARD_POSITIONS,
  DIFFICULTY_SHORT,
  DIFFICULTY_TOKEN,
  housesPerSide,
  squareLabel,
  THEME_TOKEN,
  type BoardPosition,
} from "@/game/config";
import type { PlayerState } from "@/game/types";
import { cn } from "@/lib/utils";

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

function squareStyle(square: BoardPosition): React.CSSProperties {
  if (square.type === "question") {
    return {
      backgroundColor: `color-mix(in oklab, var(${THEME_TOKEN[square.theme]}) 78%, white)`,
      borderColor: `var(${THEME_TOKEN[square.theme]})`,
    };
  }
  return {};
}

function SquareBody({ square }: { square: BoardPosition }) {
  if (square.type === "question") {
    return (
      <span className="flex h-full items-end justify-end">
        <span
          className="grid h-4 w-4 place-items-center rounded-full text-[0.55rem] font-black text-background shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
          style={{ backgroundColor: `var(${DIFFICULTY_TOKEN[square.difficulty]})` }}
          title={`${square.theme} · ${square.difficulty}`}
        >
          {DIFFICULTY_SHORT[square.difficulty]}
        </span>
      </span>
    );
  }
  if (square.type === "bonus") {
    return (
      <span className="flex h-full flex-col items-center justify-center text-center leading-none">
        <span className="text-2xl font-black text-gold drop-shadow-[0_0_10px_rgba(255,190,60,0.95)]">★</span>
        <span className="text-[0.6rem] font-black uppercase text-gold">+{square.bonusMove}</span>
      </span>
    );
  }
  if (square.type === "penalty") {
    return (
      <span className="flex h-full flex-col items-center justify-center text-center leading-none">
        <span className="text-2xl font-black text-destructive drop-shadow-[0_0_10px_rgba(255,70,70,0.95)]">⚠</span>
        <span className="text-[0.6rem] font-black uppercase text-destructive">−{square.penaltyMove}</span>
      </span>
    );
  }
  if (square.type === "event") {
    return (
      <span className="flex h-full items-center justify-center">
        <span className="text-4xl font-black text-accent drop-shadow-[0_0_16px_rgba(70,150,255,1)]">?</span>
      </span>
    );
  }
  if (square.type === "finish") {
    return (
      <span className="flex h-full flex-col items-center justify-center text-center leading-none">
        <span className="text-xl">⚑</span>
        <span className="text-[0.6rem] font-black uppercase tracking-widest text-gold-foreground">Finish</span>
      </span>
    );
  }
  return (
    <span className="flex h-full flex-col items-center justify-center text-center leading-none">
      <span className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-board-foreground">
        {square.label}
      </span>
      {square.type === "start" && <span className="mt-0.5 text-[0.9rem] text-gold">▶▶</span>}
    </span>
  );
}

function Pawn({ player, isCurrent }: { player: PlayerState; isCurrent: boolean }) {
  return (
    <span
      title={player.name}
      className={cn(
        "pawn-token relative grid h-6 w-4 shrink-0 place-items-end rounded-t-full rounded-b-sm border border-background/70",
        isCurrent && "animate-pawn-pop ring-2 ring-gold",
      )}
      style={{ backgroundColor: player.color }}
    >
      <span className="pb-0.5 text-[0.5rem] font-black leading-none text-background">{player.number}</span>
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
    <div className="board-surface-light relative aspect-square w-[min(88vmin,900px)] rounded-[1.75rem] p-2 shadow-board [transform-style:preserve-3d]">
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
              style={{ gridRow: cell.row, gridColumn: cell.col, ...squareStyle(square) }}
              aria-label={squareLabel(square)}
              className={cn(
                "tile-light relative flex flex-col overflow-visible rounded-md border p-1",
                square.type !== "question" && "bg-board",
                square.type === "event" && "border-accent",
                square.type === "bonus" && "border-gold",
                square.type === "penalty" && "border-destructive",
                square.type === "finish" && "border-gold bg-gold",
                isActive && "ring-2 ring-gold shadow-gold-glow",
              )}
            >
              <SquareBody square={square} />
              {occupants.length > 0 && (
                <span className="pawn-3d pointer-events-none absolute inset-x-0 -top-2 flex flex-wrap items-end justify-center gap-0.5">
                  {occupants.map((p) => (
                    <Pawn key={p.id} player={p} isCurrent={p.id === currentPlayerId} />
                  ))}
                </span>
              )}
            </div>
          );
        })}

        <div
          style={{ gridRow: `2 / ${inner + 1}`, gridColumn: `2 / ${inner + 1}` }}
          className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-board p-4 text-center"
        >
          <span className="ip-graffiti pointer-events-none absolute inset-0" aria-hidden="true" />
          <p className="text-gradient-gold font-display text-3xl font-black uppercase tracking-[0.22em] sm:text-4xl">
            WHIP
          </p>
          <p className="mt-1 max-w-[22rem] text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
            World &amp; Highlights in Intellectual Property
          </p>

          {timerActive && (
            <div className="mt-4 w-full max-w-[18rem]">
              <p
                className={cn(
                  "font-display text-6xl font-black tabular-nums",
                  left <= 10 ? "animate-tick-pulse text-destructive" : "text-gold",
                )}
              >
                {left}s
              </p>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-background/60">
                <div
                  className={cn("h-full rounded-full transition-all", left <= 10 ? "bg-destructive" : "bg-accent")}
                  style={{ width: `${(left / total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <p className="mt-4 text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
            ▶ Play runs clockwise · ⚑ Finish before START
          </p>
        </div>
      </div>
    </div>
  );
}
