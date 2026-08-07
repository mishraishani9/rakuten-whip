import type { BoardTheme, Difficulty } from "./config";

export type Question = {
  record_id: string;
  record_type: string;
  difficulty: Difficulty;
  theme: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  correct_answer: string;
};

export type PlayerState = {
  id: string;
  dbId?: string;
  number: number;
  name: string;
  color: string;
  position: number;
  laps: number;
  correct: number;
  incorrect: number;
  timeouts: number;
  bonuses: number;
  club: number;
  bar: number;
  jail: number;
  turns: number;
  missTurns: number;
  inJail: boolean;
  completedCircuit: boolean;
};

export type GamePhase =
  | "SETUP"
  | "READY"
  | "PLAYER_TURN"
  | "MOVING"
  | "QUESTION_ACTIVE"
  | "ANSWER_SELECTED"
  | "ANSWER_REVEALED"
  | "BONUS_ACTION"
  | "SPECIAL_EVENT"
  | "NO_QUESTION"
  | "PAUSED"
  | "WINNER"
  | "GAME_COMPLETE";

export type NoticeTone = "info" | "success" | "danger" | "warning";

export type GameState = {
  gameId: string | null;
  gameName: string;
  phase: GamePhase;
  phaseBeforePause: GamePhase | null;
  players: PlayerState[];
  currentPlayerId: string;
  turnNumber: number;
  lastDice: number | null;
  usedQuestionIds: string[];
  currentQuestion: Question | null;
  currentSquareTheme: BoardTheme | null;
  currentSquareDifficulty: Difficulty | null;
  selectedOption: "A" | "B" | "C" | "D" | null;
  wasTimeout: boolean;
  timeRemaining: number;
  notice: { title: string; body?: string; tone: NoticeTone } | null;
  winnerIds: string[];
  startedAt: number;
  questionsAnswered: number;
  saveError: string | null;
};

export type Snapshot = Omit<GameState, "phaseBeforePause">;