// Central game configuration. Change the board, event rules or settings here —
// gameplay logic never hard-codes any of it.

export type Difficulty = "Easy" | "Medium" | "Hard";

export type BoardPosition =
  | { position: number; type: "start" | "club" | "bar" | "jail" | "finish"; label: string }
  | { position: number; type: "question"; theme: BoardTheme; difficulty: Difficulty }
  | { position: number; type: "bonus"; bonusMove: number }
  | { position: number; type: "penalty"; penaltyMove: number }
  | { position: number; type: "event" };

export const GAME_SETTINGS = {
  QUESTION_TIME_SECONDS: 30,
  MAX_PLAYERS: 10,
  MIN_PLAYERS: 2,
  DEFAULT_PLAYERS: 4,
  MAX_ROLLBACKS: 5,
  MAX_BONUS_CHAIN: 1,
  BOARD_SIZE: 24,
  DEFAULT_BOARD_SIZE: 24,
  JAIL_RELEASE_ROLLS: [1, 6],
  CLUB_MISS_TURNS: 1,
  BAR_MISS_TURNS: 2,
  REVEAL_DELAY_MS: 900,
} as const;

/** Valid board sizes: 4 corners + equal number of houses per side. */
export const BOARD_SIZE_OPTIONS = [16, 20, 24, 28, 32, 36, 40, 44, 48];

export function housesPerSide(boardSize: number) {
  return (boardSize - 4) / 4;
}

export function isValidBoardSize(size: number) {
  return Number.isInteger(size) && size >= 16 && size <= 48 && (size - 4) % 4 === 0;
}

export const BOARD_THEMES = [
  "Patent",
  "Trademark",
  "IP Fundamentals",
  "Prior Art",
  "Inventorship",
  "Patentability",
  "Trade Secrets",
  "SEPs & Standards",
  "Copyright",
] as const;

export type BoardTheme = (typeof BOARD_THEMES)[number];

/**
 * Board categories map to the raw `theme` values found in the CSV question bank.
 * Adding a new CSV theme only requires listing it under the right category.
 */
export const THEME_GROUPS: Record<BoardTheme, string[]> = {
  Patent: [
    "Patent basics",
    "Patent rights",
    "Patent term",
    "Patent filing",
    "Patent claims",
    "Patent portfolio",
    "Patent scope",
    "Territorial rights",
  ],
  Trademark: ["Trademark basics", "Trademark law", "Trademarks"],
  "IP Fundamentals": [
    "IP fundamentals",
    "IP types",
    "Invention disclosure",
    "Invention disclosure diagrams",
    "Problem definition",
    "Solution description",
    "Technical/business value",
    "Disclosure risk",
    "Public disclosure",
    "Public disclosure & prior art",
  ],
  "Prior Art": ["Prior art", "Prior art & novelty", "Novelty vs inventive step"],
  Inventorship: ["Inventorship", "AI inventions"],
  Patentability: [
    "Patentability",
    "Patentability basics",
    "Patentability—novelty",
    "Patentability—inventive step",
    "Inventive step",
    "Software inventions",
  ],
  "Trade Secrets": ["Trade secrets", "Trade secrets vs patents"],
  "SEPs & Standards": [
    "SEPs & standards",
    "SEPs",
    "SEP claim mapping",
    "Standards contributions",
    "Standards & SEPs",
    "FRAND & SEPs",
    "Technical contribution",
  ],
  Copyright: ["Copyright"],
};

/** Any raw CSV theme not listed above still resolves to a board category. */
export function boardThemeForRawTheme(rawTheme: string): BoardTheme | null {
  for (const group of BOARD_THEMES) {
    if (THEME_GROUPS[group].some((t) => t.toLowerCase() === rawTheme.toLowerCase())) return group;
  }
  return null;
}

const BOARD_THEME_CYCLE: BoardTheme[] = [
  "IP Fundamentals",
  "Patent",
  "Trademark",
  "Copyright",
  "Prior Art",
  "Patentability",
  "Inventorship",
  "Trade Secrets",
  "SEPs & Standards",
];

/**
 * Builds a perimeter board of `size` houses: 4 corners
 * (START, CLUB, BAR, JAIL) plus (size - 4) / 4 houses on each side.
 * The final house before START is the FINISH line.
 */
export function buildBoard(size: number): BoardPosition[] {
  const total = isValidBoardSize(size) ? size : GAME_SETTINGS.DEFAULT_BOARD_SIZE;
  const perSide = housesPerSide(total);
  const corners = new Map<number, { type: "start" | "club" | "bar" | "jail"; label: string }>([
    [0, { type: "start", label: "START" }],
    [perSide + 1, { type: "club", label: "CLUB" }],
    [2 * (perSide + 1), { type: "bar", label: "BAR" }],
    [3 * (perSide + 1), { type: "jail", label: "JAIL" }],
  ]);

  const openSlots: number[] = [];
  for (let i = 1; i < total; i++) {
    if (!corners.has(i) && i !== total - 1) openSlots.push(i);
  }

  const specialCount = Math.max(2, Math.round(total / 10));
  const eventCount = Math.max(3, Math.round(total / 8));
  const special = new Map<number, BoardPosition>();
  const takeEvenly = (count: number, offset: number, make: (n: number) => BoardPosition) => {
    if (count <= 0 || openSlots.length === 0) return;
    const step = openSlots.length / count;
    for (let n = 0; n < count; n++) {
      for (let attempt = 0; attempt < openSlots.length; attempt++) {
        const idx = Math.floor(n * step + offset + attempt) % openSlots.length;
        const slot = openSlots[idx]!;
        if (!special.has(slot)) {
          special.set(slot, make(n));
          break;
        }
      }
    }
  };

  takeEvenly(specialCount, 1, (n) => ({ position: 0, type: "bonus", bonusMove: n % 2 === 0 ? 3 : 4 }));
  takeEvenly(specialCount, 3, (n) => ({ position: 0, type: "penalty", penaltyMove: n % 2 === 0 ? 2 : 3 }));
  takeEvenly(eventCount, 5, () => ({ position: 0, type: "event" }));

  const board: BoardPosition[] = [];
  let themeIndex = 0;
  for (let i = 0; i < total; i++) {
    const corner = corners.get(i);
    if (corner) {
      board.push({ position: i, ...corner });
      continue;
    }
    if (i === total - 1) {
      board.push({ position: i, type: "finish", label: "FINISH" });
      continue;
    }
    const preset = special.get(i);
    if (preset) {
      board.push({ ...preset, position: i });
      continue;
    }
    const side = Math.floor(i / (perSide + 1));
    const difficulty: Difficulty = side === 0 ? "Easy" : side === 3 ? "Hard" : "Medium";
    const theme = BOARD_THEME_CYCLE[themeIndex % BOARD_THEME_CYCLE.length]!;
    themeIndex++;
    board.push({ position: i, type: "question", theme, difficulty });
  }
  return board;
}

export const BOARD_POSITIONS: BoardPosition[] = buildBoard(GAME_SETTINGS.DEFAULT_BOARD_SIZE);

export type EventOutcome =
  | { kind: "goto"; target: "club" | "bar" | "jail"; label: string; description: string }
  | { kind: "bonus"; amount: number; label: string; description: string };

/** Outcome of a "?" square, driven by the dice value that landed the player there. */
export const EVENT_RULES: Record<number, EventOutcome> = {
  1: { kind: "goto", target: "bar", label: "OFF TO THE BAR", description: "Networking got out of hand — go to BAR and miss two turns." },
  2: { kind: "bonus", amount: 3, label: "FAST TRACK +3", description: "Your filing was fast-tracked. Move forward 3 spaces." },
  3: { kind: "goto", target: "jail", label: "INFRINGEMENT NOTICE", description: "An injunction lands on your desk — go to JAIL." },
  4: { kind: "goto", target: "club", label: "INNOVATORS CLUB", description: "Invited to the Innovators Club — go to CLUB and miss one turn." },
  5: { kind: "bonus", amount: -3, label: "OPPOSITION FILED −3", description: "An opposition was filed — move back 3 spaces." },
  6: { kind: "bonus", amount: 4, label: "GRANT ISSUED +4", description: "Your patent was granted. Move forward 4 spaces." },
};

export const PAWN_COLORS = [
  "#2563eb",
  "#e11d48",
  "#16a34a",
  "#f59e0b",
  "#9333ea",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#475569",
];

export const CORNER_POSITION: Record<"club" | "bar" | "jail" | "start", number> = {
  start: 0,
  club: 6,
  bar: 12,
  jail: 18,
};

export const CSV_COLUMNS = [
  "Record_Type",
  "Record_ID",
  "Difficulty",
  "Theme",
  "Question",
  "Option_A",
  "Option_B",
  "Option_C",
  "Option_D",
  "Correct_Option",
  "Correct_Answer",
] as const;

export const REQUIRED_CSV_COLUMNS = CSV_COLUMNS.filter((c) => c !== "Record_Type");

export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

export function cornerPositions(boardSize: number) {
  const perSide = housesPerSide(boardSize);
  return {
    start: 0,
    club: perSide + 1,
    bar: 2 * (perSide + 1),
    jail: 3 * (perSide + 1),
    finish: boardSize - 1,
  };
}

export function squareAt(position: number, board: BoardPosition[] = BOARD_POSITIONS): BoardPosition {
  const size = board.length;
  const normalized = ((position % size) + size) % size;
  return board[normalized]!;
}

export function squareLabel(square: BoardPosition): string {
  switch (square.type) {
    case "question":
      return `${square.theme} · ${square.difficulty}`;
    case "bonus":
      return `Bonus +${square.bonusMove}`;
    case "penalty":
      return `Penalty −${square.penaltyMove}`;
    case "event":
      return "Event ?";
    default:
      return square.label;
  }
}