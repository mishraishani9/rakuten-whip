// Central game configuration. Change the board, event rules or settings here —
// gameplay logic never hard-codes any of it.

export type Difficulty = "Easy" | "Medium" | "Hard";

export type BoardPosition =
  | { position: number; type: "start" | "club" | "bar" | "jail"; label: string }
  | { position: number; type: "question"; theme: BoardTheme; difficulty: Difficulty }
  | { position: number; type: "bonus"; bonusMove: number }
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

/** 24 perimeter squares. Corners: 0 START, 6 CLUB, 12 BAR, 18 JAIL. */
export const BOARD_POSITIONS: BoardPosition[] = [
  { position: 0, type: "start", label: "START" },
  { position: 1, type: "question", theme: "IP Fundamentals", difficulty: "Easy" },
  { position: 2, type: "question", theme: "Patent", difficulty: "Easy" },
  { position: 3, type: "event" },
  { position: 4, type: "question", theme: "Trademark", difficulty: "Easy" },
  { position: 5, type: "question", theme: "Prior Art", difficulty: "Medium" },
  { position: 6, type: "club", label: "CLUB" },
  { position: 7, type: "question", theme: "Trademark", difficulty: "Medium" },
  { position: 8, type: "bonus", bonusMove: 2 },
  { position: 9, type: "question", theme: "Patentability", difficulty: "Medium" },
  { position: 10, type: "question", theme: "Copyright", difficulty: "Easy" },
  { position: 11, type: "question", theme: "Inventorship", difficulty: "Medium" },
  { position: 12, type: "bar", label: "BAR" },
  { position: 13, type: "question", theme: "Trade Secrets", difficulty: "Medium" },
  { position: 14, type: "event" },
  { position: 15, type: "question", theme: "SEPs & Standards", difficulty: "Hard" },
  { position: 16, type: "question", theme: "Patent", difficulty: "Medium" },
  { position: 17, type: "question", theme: "Prior Art", difficulty: "Hard" },
  { position: 18, type: "jail", label: "JAIL" },
  { position: 19, type: "question", theme: "Patentability", difficulty: "Hard" },
  { position: 20, type: "bonus", bonusMove: 3 },
  { position: 21, type: "question", theme: "Inventorship", difficulty: "Hard" },
  { position: 22, type: "event" },
  { position: 23, type: "question", theme: "IP Fundamentals", difficulty: "Medium" },
];

export type EventOutcome =
  | { kind: "goto"; target: "club" | "bar" | "jail"; label: string; description: string }
  | { kind: "bonus"; amount: number; label: string; description: string };

/** Outcome of a "?" square, driven by the dice value that landed the player there. */
export const EVENT_RULES: Record<number, EventOutcome> = {
  1: { kind: "goto", target: "bar", label: "OFF TO THE BAR", description: "Networking got out of hand — go to BAR and miss two turns." },
  2: { kind: "bonus", amount: 2, label: "FAST TRACK +2", description: "Your filing was fast-tracked. Move forward 2 spaces." },
  3: { kind: "goto", target: "jail", label: "INFRINGEMENT NOTICE", description: "An injunction lands on your desk — go to JAIL." },
  4: { kind: "goto", target: "club", label: "INNOVATORS CLUB", description: "Invited to the Innovators Club — go to CLUB and miss one turn." },
  5: { kind: "goto", target: "bar", label: "LICENSING DINNER", description: "A long licensing dinner — go to BAR and miss two turns." },
  6: { kind: "bonus", amount: 3, label: "GRANT ISSUED +3", description: "Your patent was granted. Move forward 3 spaces." },
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

export function squareAt(position: number): BoardPosition {
  const normalized = ((position % GAME_SETTINGS.BOARD_SIZE) + GAME_SETTINGS.BOARD_SIZE) % GAME_SETTINGS.BOARD_SIZE;
  return BOARD_POSITIONS[normalized]!;
}

export function squareLabel(square: BoardPosition): string {
  switch (square.type) {
    case "question":
      return `${square.theme} · ${square.difficulty}`;
    case "bonus":
      return `Bonus +${square.bonusMove}`;
    case "event":
      return "Event ?";
    default:
      return square.label;
  }
}