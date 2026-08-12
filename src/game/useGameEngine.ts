import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BOARD_POSITIONS,
  buildBoard,
  cornerPositions,
  EVENT_RULES,
  GAME_SETTINGS,
  squareAt,
  type BoardPosition,
  type BoardTheme,
  type Difficulty,
} from "./config";
import type { GameState, PlayerState, Question, Snapshot } from "./types";
import { loadQuestionBank, pickQuestion, poolFor } from "@/services/questionService";
import * as gameService from "@/services/gameService";

export type SetupPlayer = {
  number: number;
  name: string;
  color: string;
  email?: string | null;
  userId?: string | null;
  isOnline?: boolean;
};
export type StartOptions = { boardSize?: number; goldenFirst?: boolean };

const SESSION_KEY = "ipquiz.activeGame";

function makePlayer(p: SetupPlayer): PlayerState {
  return {
    id: `p${p.number}`,
    number: p.number,
    name: p.name,
    color: p.color,
    position: 0,
    laps: 0,
    correct: 0,
    incorrect: 0,
    timeouts: 0,
    bonuses: 0,
    club: 0,
    bar: 0,
    jail: 0,
    turns: 0,
    missTurns: 0,
    inJail: false,
    completedCircuit: false,
  };
}

export function initialState(
  gameName: string,
  setup: SetupPlayer[],
  options: StartOptions = {},
): GameState {
  const players = setup.map(makePlayer);
  const boardSize = options.boardSize ?? GAME_SETTINGS.DEFAULT_BOARD_SIZE;
  const board = buildBoard(boardSize);
  return {
    gameId: null,
    gameName,
    phase: "READY",
    phaseBeforePause: null,
    board,
    boardSize: board.length,
    goldenFirst: options.goldenFirst ?? false,
    players,
    currentPlayerId: players[0]?.id ?? "p1",
    turnNumber: 1,
    lastDice: null,
    rollsThisTurn: 0,
    prevPosition: null,
    usedQuestionIds: [],
    currentQuestion: null,
    currentSquareTheme: null,
    currentSquareDifficulty: null,
    selectedOption: null,
    wasTimeout: false,
    timeRemaining: GAME_SETTINGS.QUESTION_TIME_SECONDS,
    notice: null,
    winnerIds: [],
    startedAt: Date.now(),
    questionsAnswered: 0,
    saveError: null,
  };
}

export function loadStoredState(): GameState | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function storeState(state: GameState | null) {
  if (typeof window === "undefined") return;
  if (!state) window.sessionStorage.removeItem(SESSION_KEY);
  else window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
}

function nextEligible(
  state: GameState,
  fromId: string,
): { players: PlayerState[]; nextId: string; skipped: string[] } {
  const players = state.players.map((p) => ({ ...p }));
  const startIndex = players.findIndex((p) => p.id === fromId);
  const skipped: string[] = [];
  for (let step = 1; step <= players.length; step++) {
    const candidate = players[(startIndex + step) % players.length]!;
    if (candidate.id !== fromId && candidate.missTurns > 0) {
      candidate.missTurns -= 1;
      const left = candidate.missTurns;
      skipped.push(
        left > 0
          ? `${candidate.name} skips this turn (${left} more skip${left === 1 ? "" : "s"} left).`
          : `${candidate.name} skips this turn (back in play next round).`,
      );
      continue;
    }
    return { players, nextId: candidate.id, skipped };
  }
  return { players, nextId: fromId, skipped };
}

export function useGameEngine() {
  const [state, setState] = useState<GameState | null>(null);
  const [bank, setBank] = useState<Question[]>([]);
  const [bankError, setBankError] = useState<string | null>(null);
  const historyRef = useRef<Snapshot[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const stateRef = useRef<GameState | null>(null);
  stateRef.current = state;
  /** Authoritative set of question ids already served in this session. */
  const usedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadQuestionBank()
      .then(setBank)
      .catch((error: unknown) =>
        setBankError(error instanceof Error ? error.message : "Question bank unavailable"),
      );
  }, []);

  useEffect(() => {
    storeState(state);
  }, [state]);

  const update = useCallback((mutate: (prev: GameState) => GameState) => {
    setState((prev) => (prev ? mutate(prev) : prev));
  }, []);

  const pushHistory = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    const { phaseBeforePause: _ignored, ...snapshot } = current;
    historyRef.current = [...historyRef.current, snapshot].slice(-GAME_SETTINGS.MAX_ROLLBACKS);
    setUndoCount(historyRef.current.length);
  }, []);

  const safe = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action();
        update((prev) => (prev.saveError ? { ...prev, saveError: null } : prev));
      } catch {
        update((prev) => ({
          ...prev,
          saveError:
            "Your current game is still active, but saving to game history is temporarily unavailable.",
        }));
      }
    },
    [update],
  );

  /** Begin a game: creates the backend records but never blocks gameplay. */
  const startGame = useCallback(
    async (gameName: string, setup: SetupPlayer[], options: StartOptions = {}) => {
      const fresh = initialState(gameName, setup, options);
      historyRef.current = [];
      usedIdsRef.current = new Set();
      setUndoCount(0);
      setState(fresh);
      try {
        const { gameId, dbIdByNumber } = await gameService.createGame(gameName, fresh.players);
        setState((prev) =>
          prev
            ? {
                ...prev,
                gameId,
                players: prev.players.map((p) => ({ ...p, dbId: dbIdByNumber.get(p.number) })),
              }
            : prev,
        );
      } catch {
        setState((prev) =>
          prev
            ? {
                ...prev,
                saveError:
                  "Your current game is still active, but saving to game history is temporarily unavailable.",
              }
            : prev,
        );
      }
    },
    [],
  );

  const resumeStored = useCallback(() => {
    const stored = loadStoredState();
    if (stored) {
      usedIdsRef.current = new Set(stored.usedQuestionIds);
      setState({ ...stored, phase: stored.phase === "PAUSED" ? "PAUSED" : stored.phase });
    }
    return stored;
  }, []);

  const currentPlayer = useMemo(
    () => state?.players.find((p) => p.id === state.currentPlayerId) ?? null,
    [state],
  );

  const log = useCallback(
    (payload: Omit<gameService.EventPayload, "gameId">) => {
      const current = stateRef.current;
      if (!current?.gameId) return;
      void safe(() => gameService.logEvent({ ...payload, gameId: current.gameId! }));
    },
    [safe],
  );

  /** Presents the question for a question square, or the no-question fallback. */
  const presentQuestion = useCallback(
    (theme: BoardTheme, difficulty: Difficulty) => {
      const current = stateRef.current;
      const usedIds = [...new Set([...(current?.usedQuestionIds ?? []), ...usedIdsRef.current])];
      const question = pickQuestion(
        bank,
        theme,
        difficulty,
        usedIds,
        undefined,
        current?.goldenFirst ?? false,
      );
      if (!question) {
        update((prev) => ({
          ...prev,
          phase: "NO_QUESTION",
          currentQuestion: null,
          currentSquareTheme: theme,
          currentSquareDifficulty: difficulty,
          notice: {
            title: "No unused questions remain for this category.",
            body: `${theme} · ${difficulty}`,
            tone: "warning",
          },
        }));
        return;
      }
      usedIdsRef.current.add(question.record_id);
      update((prev) => ({
        ...prev,
        phase: "QUESTION_ACTIVE",
        currentQuestion: question,
        currentSquareTheme: theme,
        currentSquareDifficulty: difficulty,
        selectedOption: null,
        wasTimeout: false,
        timeRemaining: GAME_SETTINGS.QUESTION_TIME_SECONDS,
        usedQuestionIds: [...new Set([...prev.usedQuestionIds, question.record_id])],
        notice: null,
      }));
      log({ eventType: "QUESTION", theme, difficulty });
    },
    [bank, log, update],
  );

  /** Resolves the square a player landed on. */
  const resolveLanding = useCallback(
    (playerId: string, position: number, dice: number, bonusChain: number) => {
      const board: BoardPosition[] = stateRef.current?.board ?? BOARD_POSITIONS;
      const size = board.length;
      const finishAt = size - 1;
      const square = squareAt(position, board);
      const applyPlayer = (mutate: (p: PlayerState) => PlayerState) =>
        update((prev) => ({
          ...prev,
          players: prev.players.map((p) => (p.id === playerId ? mutate({ ...p }) : p)),
        }));

      switch (square.type) {
        case "question":
          presentQuestion(square.theme, square.difficulty);
          return;
        case "bonus": {
          applyPlayer((p) => ({ ...p, bonuses: p.bonuses + 1 }));
          log({ eventType: "BONUS", position, diceValue: dice });
          update((prev) => ({
            ...prev,
            phase: "BONUS_ACTION",
            notice: {
              title: `BONUS! Move forward ${square.bonusMove} spaces.`,
              tone: "success",
            },
          }));
          window.setTimeout(() => {
            const current = stateRef.current;
            if (!current || current.phase === "PAUSED") return;
            let landed = position;
            let won = false;
            update((prev) => ({
              ...prev,
              players: prev.players.map((p) => {
                if (p.id !== playerId) return p;
                const raw = p.position + square.bonusMove;
                if (raw >= finishAt) {
                  won = true;
                  landed = finishAt;
                  return { ...p, position: finishAt, laps: p.laps + 1, completedCircuit: true };
                }
                landed = raw;
                return { ...p, position: raw };
              }),
            }));
            if (won) {
              declareWinner(playerId);
              return;
            }
            if (
              bonusChain >= GAME_SETTINGS.MAX_BONUS_CHAIN &&
              squareAt(landed, board).type === "bonus"
            ) {
              update((prev) => ({
                ...prev,
                phase: "PLAYER_TURN",
                notice: { title: "Bonus chain limit reached. Turn continues.", tone: "info" },
              }));
              return;
            }
            // A bonus never drops a pawn into a penalty.
            if (squareAt(landed, board).type === "penalty") {
              update((prev) => ({ ...prev, phase: "PLAYER_TURN", notice: null }));
              return;
            }
            resolveLanding(playerId, landed, dice, bonusChain + 1);
          }, 900);
          return;
        }
        case "penalty": {
          log({ eventType: "BONUS", position, diceValue: dice });
          update((prev) => ({
            ...prev,
            phase: "BONUS_ACTION",
            notice: {
              title: `PENALTY! Move back ${square.penaltyMove} spaces.`,
              tone: "danger",
            },
          }));
          window.setTimeout(() => {
            const current = stateRef.current;
            if (!current || current.phase === "PAUSED") return;
            let landed = position;
            update((prev) => ({
              ...prev,
              players: prev.players.map((p) => {
                if (p.id !== playerId) return p;
                landed = Math.max(0, p.position - square.penaltyMove);
                return { ...p, position: landed };
              }),
            }));
            // A penalty never drops a pawn onto a penalty or a bonus.
            const next = squareAt(landed, board).type;
            if (next === "penalty" || next === "bonus") {
              update((prev) => ({ ...prev, phase: "PLAYER_TURN", notice: null }));
              return;
            }
            resolveLanding(playerId, landed, dice, bonusChain + 1);
          }, 900);
          return;
        }
        case "event": {
          const outcome = EVENT_RULES[dice];
          if (!outcome) {
            update((prev) => ({ ...prev, phase: "PLAYER_TURN" }));
            return;
          }
          update((prev) => ({
            ...prev,
            phase: "SPECIAL_EVENT",
            notice: { title: `? ${outcome.label}`, body: outcome.description, tone: "warning" },
          }));
          if (outcome.kind === "bonus") {
            applyPlayer((p) => ({ ...p, bonuses: p.bonuses + 1 }));
            log({ eventType: "BONUS", position, diceValue: dice });
            window.setTimeout(() => {
              const current = stateRef.current;
              if (!current || current.phase === "PAUSED") return;
              let landed = position;
              let won = false;
              update((prev) => ({
                ...prev,
                players: prev.players.map((p) => {
                  if (p.id !== playerId) return p;
                  const raw = p.position + outcome.amount;
                  if (raw >= finishAt) {
                    won = true;
                    landed = finishAt;
                    return { ...p, position: finishAt, laps: p.laps + 1, completedCircuit: true };
                  }
                  landed = Math.max(0, raw);
                  return { ...p, position: landed };
                }),
              }));
              if (won) declareWinner(playerId);
              else resolveLanding(playerId, landed, dice, bonusChain + 1);
            }, 1200);
            return;
          }
          const target = cornerPositions(size)[outcome.target];
          window.setTimeout(() => {
            const current = stateRef.current;
            if (!current || current.phase === "PAUSED") return;
            update((prev) => ({
              ...prev,
              players: prev.players.map((p) =>
                p.id === playerId ? { ...p, position: target } : p,
              ),
            }));
            resolveLanding(playerId, target, dice, bonusChain + 1);
          }, 1200);
          return;
        }
        case "club":
          applyPlayer((p) => ({
            ...p,
            club: p.club + 1,
            missTurns: p.missTurns + GAME_SETTINGS.CLUB_MISS_TURNS,
          }));
          log({ eventType: "CLUB", position });
          update((prev) => ({
            ...prev,
            phase: "SPECIAL_EVENT",
            notice: {
              title: "CLUB — you miss your next turn.",
              body: "Networking at the IP club: your pawn stays put and your next turn is skipped. Play passes to the next player automatically.",
              tone: "warning",
            },
          }));
          autoAdvanceAfterRule(playerId);
          return;
        case "bar":
          applyPlayer((p) => ({
            ...p,
            bar: p.bar + 1,
            missTurns: p.missTurns + GAME_SETTINGS.BAR_MISS_TURNS,
          }));
          log({ eventType: "BAR", position });
          update((prev) => ({
            ...prev,
            phase: "SPECIAL_EVENT",
            notice: {
              title: `BAR — you miss your next ${GAME_SETTINGS.BAR_MISS_TURNS} turn(s).`,
              body: "Too long at the bar: your turn ends now and your next turn is skipped automatically. Play passes to the next player.",
              tone: "warning",
            },
          }));
          autoAdvanceAfterRule(playerId);
          return;
        case "jail":
          applyPlayer((p) => ({ ...p, jail: p.jail + 1, inJail: true }));
          log({ eventType: "JAIL", position });
          update((prev) => ({
            ...prev,
            phase: "SPECIAL_EVENT",
            notice: {
              title: "JAIL — your turn ends here.",
              body: `Roll ${GAME_SETTINGS.JAIL_RELEASE_ROLLS.join(" or ")} on your turn to escape.`,
              tone: "danger",
            },
          }));
          autoAdvanceAfterRule(playerId);
          return;
        case "start":
          update((prev) => ({
            ...prev,
            phase: "PLAYER_TURN",
            notice: { title: "Back at START.", tone: "info" },
          }));
          return;
        case "finish":
          declareWinner(playerId);
          return;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bank, log, presentQuestion, update],
  );

  const declareWinner = useCallback(
    (playerId: string) => {
      update((prev) => ({
        ...prev,
        phase: "WINNER",
        winnerIds: prev.winnerIds.includes(playerId)
          ? prev.winnerIds
          : [...prev.winnerIds, playerId],
        currentQuestion: null,
        notice: {
          title: `🏆 ${prev.players.find((p) => p.id === playerId)?.name ?? "Player"} wins!`,
          body: "They reached the FINISH flag. Close this to see the final scoreboard.",
          tone: "success" as const,
        },
      }));
      log({ eventType: "MOVE", position: 0 });
    },
    [log, update],
  );

  const endTurn = useCallback(() => {
    update((prev) => {
      const { players, nextId, skipped } = nextEligible(prev, prev.currentPlayerId);
      const nextName = players.find((p) => p.id === nextId)?.name ?? "Next player";
      return {
        ...prev,
        players,
        currentPlayerId: nextId,
        currentQuestion: null,
        selectedOption: null,
        wasTimeout: false,
        currentSquareTheme: null,
        currentSquareDifficulty: null,
        phase: "PLAYER_TURN",
        turnNumber: prev.turnNumber + 1,
        rollsThisTurn: 0,
        timeRemaining: GAME_SETTINGS.QUESTION_TIME_SECONDS,
        notice:
          skipped.length > 0
            ? {
                title: "Turns skipped",
                body: `${skipped.join(" ")} ${nextName} rolls now.`,
                tone: "warning" as const,
              }
            : null,
      };
    });
  }, [update]);

  /**
   * Club / Bar / Jail hand the turn over on their own once the rules popup has
   * been on screen long enough for everyone to read it.
   */
  const autoAdvanceAfterRule = useCallback(
    (playerId: string) => {
      window.setTimeout(() => {
        const current = stateRef.current;
        if (!current || current.phase !== "SPECIAL_EVENT") return;
        if (current.currentPlayerId !== playerId) return;
        endTurn();
      }, GAME_SETTINGS.RULE_POPUP_SECONDS * 1000);
    },
    [endTurn],
  );

  const move = useCallback(
    (dice: number) => {
      const current = stateRef.current;
      if (!current) return;
      const player = current.players.find((p) => p.id === current.currentPlayerId);
      if (!player) return;
      // A roll is only legal on the player's own turn — never while a rules
      // popup (bar / club / jail / event) or a question is still resolving.
      if (current.phase !== "PLAYER_TURN" && current.phase !== "READY") return;
      pushHistory();

      // Jail escape attempt
      if (player.inJail) {
        const escaped = GAME_SETTINGS.JAIL_RELEASE_ROLLS.includes(dice as never);
        update((prev) => ({
          ...prev,
          lastDice: dice,
          phase: "SPECIAL_EVENT",
          players: prev.players.map((p) =>
            p.id === player.id ? { ...p, inJail: !escaped, turns: p.turns + 1 } : p,
          ),
          notice: escaped
            ? { title: "You escaped Jail!", tone: "success" }
            : {
                title: "Still in Jail.",
                body: `Roll ${GAME_SETTINGS.JAIL_RELEASE_ROLLS.join(" or ")} next turn.`,
                tone: "danger",
              },
        }));
        log({
          eventType: "JAIL",
          diceValue: dice,
          playerDbId: player.dbId,
          position: player.position,
        });
        if (escaped) window.setTimeout(() => endTurn(), 1400);
        else autoAdvanceAfterRule(player.id);
        return;
      }

      const size = current.board?.length ?? GAME_SETTINGS.DEFAULT_BOARD_SIZE;
      const finishAt = size - 1;
      let landed = player.position + dice;
      let won = false;
      if (landed >= finishAt) {
        won = true;
        landed = finishAt;
      }

      update((prev) => ({
        ...prev,
        lastDice: dice,
        phase: "MOVING",
        notice: null,
        prevPosition: player.position,
        rollsThisTurn: (prev.rollsThisTurn ?? 0) + 1,
        players: prev.players.map((p) =>
          p.id === player.id
            ? {
                ...p,
                position: landed,
                turns: p.turns + 1,
                laps: won ? p.laps + 1 : p.laps,
                completedCircuit: won ? true : p.completedCircuit,
              }
            : p,
        ),
      }));
      log({ eventType: "MOVE", diceValue: dice, position: landed, playerDbId: player.dbId });

      window.setTimeout(() => {
        if (won) declareWinner(player.id);
        else resolveLanding(player.id, landed, dice, 0);
      }, 450);
    },
    [autoAdvanceAfterRule, declareWinner, endTurn, log, pushHistory, resolveLanding, update],
  );

  const selectAnswer = useCallback(
    (option: "A" | "B" | "C" | "D") => {
      const current = stateRef.current;
      if (!current?.currentQuestion || current.phase !== "QUESTION_ACTIVE") return;
      const question = current.currentQuestion;
      const isCorrect = question.correct_option === option;
      update((prev) => ({ ...prev, phase: "ANSWER_SELECTED", selectedOption: option }));
      window.setTimeout(() => {
        finishQuestion(option, isCorrect, false);
      }, GAME_SETTINGS.REVEAL_DELAY_MS);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [update],
  );

  const finishQuestion = useCallback(
    (option: "A" | "B" | "C" | "D" | null, isCorrect: boolean, isTimeout: boolean) => {
      const current = stateRef.current;
      if (!current?.currentQuestion) return;
      const question = current.currentQuestion;
      const player = current.players.find((p) => p.id === current.currentPlayerId);
      const recedeTo = current.prevPosition;
      update((prev) => ({
        ...prev,
        phase: "ANSWER_REVEALED",
        selectedOption: option,
        wasTimeout: isTimeout,
        questionsAnswered: prev.questionsAnswered + 1,
        players: prev.players.map((p) =>
          p.id === prev.currentPlayerId
            ? {
                ...p,
                position: !isCorrect && recedeTo !== null ? recedeTo : p.position,
                correct: isCorrect ? p.correct + 1 : p.correct,
                incorrect: !isCorrect ? p.incorrect + 1 : p.incorrect,
                timeouts: isTimeout ? p.timeouts + 1 : p.timeouts,
              }
            : p,
        ),
        notice: isCorrect
          ? { title: "Correct! You get another turn.", tone: "success" }
          : {
              title: isTimeout
                ? "Time up! Your pawn moves back."
                : "Incorrect! Your pawn moves back.",
              body:
                recedeTo !== null
                  ? `The pawn returns to where it stood before the dice roll (house ${recedeTo + 1}). Turn passes to the next player.`
                  : "Turn passes to the next player.",
              tone: "danger",
            },
      }));
      if (current.gameId) {
        void safe(() =>
          gameService.logQuestionResult({
            gameId: current.gameId!,
            playerDbId: player?.dbId,
            questionRecordId: question.record_id,
            theme: question.theme,
            difficulty: question.difficulty,
            selectedOption: option,
            correctOption: question.correct_option,
            isCorrect,
            isTimeout,
            position: player?.position ?? 0,
          }),
        );
        log({
          eventType: isTimeout ? "TIMEOUT" : isCorrect ? "CORRECT" : "INCORRECT",
          playerDbId: player?.dbId,
          questionId: question.record_id,
          theme: question.theme,
          difficulty: question.difficulty,
          isCorrect,
          position: player?.position,
        });
      }
    },
    [log, safe, update],
  );

  const timeout = useCallback(() => {
    const current = stateRef.current;
    if (!current || current.phase !== "QUESTION_ACTIVE") return;
    finishQuestion(null, false, true);
  }, [finishQuestion]);

  const continueAfterReveal = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    const question = current.currentQuestion;
    const wasCorrect =
      question && current.selectedOption === question.correct_option && !current.wasTimeout;
    // A correct answer earns one extra roll, but never more than 2 rolls per turn.
    if (wasCorrect && (current.rollsThisTurn ?? 0) < GAME_SETTINGS.MAX_ROLLS_PER_TURN) {
      update((prev) => ({
        ...prev,
        phase: "PLAYER_TURN",
        currentQuestion: null,
        selectedOption: null,
        currentSquareTheme: null,
        currentSquareDifficulty: null,
        timeRemaining: GAME_SETTINGS.QUESTION_TIME_SECONDS,
        notice: { title: "Same player continues — enter the next dice value.", tone: "success" },
      }));
      return;
    }
    endTurn();
  }, [endTurn, update]);

  const pause = useCallback(() => {
    update((prev) =>
      prev.phase === "PAUSED" ? prev : { ...prev, phaseBeforePause: prev.phase, phase: "PAUSED" },
    );
  }, [update]);

  const resume = useCallback(() => {
    update((prev) =>
      prev.phase === "PAUSED"
        ? { ...prev, phase: prev.phaseBeforePause ?? "PLAYER_TURN", phaseBeforePause: null }
        : prev,
    );
  }, [update]);

  const tick = useCallback(() => {
    update((prev) =>
      prev.phase === "QUESTION_ACTIVE"
        ? { ...prev, timeRemaining: Math.max(0, prev.timeRemaining - 1) }
        : prev,
    );
  }, [update]);

  const differentQuestion = useCallback(() => {
    const current = stateRef.current;
    if (!current?.currentSquareTheme || !current.currentSquareDifficulty) return;
    const discarded = current.currentQuestion?.record_id;
    // The discarded question is released back into the pool.
    const remaining = current.usedQuestionIds.filter((id) => id !== discarded);
    if (discarded) usedIdsRef.current.delete(discarded);
    const replacement = pickQuestion(
      bank,
      current.currentSquareTheme,
      current.currentSquareDifficulty,
      [...new Set([...remaining, ...usedIdsRef.current])],
      discarded,
    );
    if (!replacement) {
      if (discarded) usedIdsRef.current.add(discarded);
      update((prev) => ({
        ...prev,
        notice: {
          title: "No other unused question is available for this category.",
          tone: "warning",
        },
      }));
      return;
    }
    usedIdsRef.current.add(replacement.record_id);
    update((prev) => ({
      ...prev,
      phase: "QUESTION_ACTIVE",
      currentQuestion: replacement,
      usedQuestionIds: [...new Set([...remaining, replacement.record_id])],
      selectedOption: null,
      wasTimeout: false,
      timeRemaining: GAME_SETTINGS.QUESTION_TIME_SECONDS,
      notice: null,
    }));
  }, [bank, update]);

  const skipQuestion = useCallback(() => {
    log({ eventType: "MOVE" });
    endTurn();
  }, [endTurn, log]);

  const fallbackQuestion = useCallback(
    (theme: BoardTheme, difficulty: Difficulty) => presentQuestion(theme, difficulty),
    [presentQuestion],
  );

  const resetUsedQuestions = useCallback(() => {
    usedIdsRef.current = new Set();
    update((prev) => ({
      ...prev,
      usedQuestionIds: [],
      notice: { title: "Used questions were reset for this game.", tone: "info" },
    }));
  }, [update]);

  const selectPlayer = useCallback(
    (playerId: string) => {
      update((prev) =>
        prev.phase === "QUESTION_ACTIVE" || prev.phase === "ANSWER_SELECTED"
          ? prev
          : { ...prev, currentPlayerId: playerId, notice: null, phase: "PLAYER_TURN" },
      );
    },
    [update],
  );

  const manualMove = useCallback(
    (playerId: string, position: number) => {
      pushHistory();
      const player = stateRef.current?.players.find((p) => p.id === playerId);
      update((prev) => ({
        ...prev,
        players: prev.players.map((p) => (p.id === playerId ? { ...p, position } : p)),
        notice: {
          title: "Administrative move applied.",
          body: `Player moved to position ${position}.`,
          tone: "info",
        },
      }));
      log({ eventType: "MANUAL_MOVE", position, playerDbId: player?.dbId });
    },
    [log, pushHistory, update],
  );

  const renamePlayer = useCallback(
    (playerId: string, name: string) => {
      const player = stateRef.current?.players.find((p) => p.id === playerId);
      update((prev) => ({
        ...prev,
        players: prev.players.map((p) => (p.id === playerId ? { ...p, name } : p)),
      }));
      if (player?.dbId) void safe(() => gameService.renamePlayer(player.dbId!, name));
    },
    [safe, update],
  );

  const renameGame = useCallback(
    (name: string) => {
      const gameId = stateRef.current?.gameId;
      update((prev) => ({ ...prev, gameName: name }));
      if (gameId) void safe(() => gameService.renameGame(gameId, name));
    },
    [safe, update],
  );

  /** Presenter/admin tool: drop a player mid-game. */
  const removePlayer = useCallback(
    (playerId: string) => {
      pushHistory();
      update((prev) => {
        if (prev.players.length <= 1) return prev;
        const removed = prev.players.find((p) => p.id === playerId);
        const players = prev.players.filter((p) => p.id !== playerId);
        const wasCurrent = prev.currentPlayerId === playerId;
        return {
          ...prev,
          players,
          currentPlayerId: wasCurrent ? players[0]!.id : prev.currentPlayerId,
          currentQuestion: wasCurrent ? null : prev.currentQuestion,
          selectedOption: wasCurrent ? null : prev.selectedOption,
          phase: wasCurrent ? "PLAYER_TURN" : prev.phase,
          winnerIds: prev.winnerIds.filter((id) => id !== playerId),
          notice: {
            title: `${removed?.name ?? "Player"} was removed from the game.`,
            tone: "info",
          },
        };
      });
      log({ eventType: "MANUAL_MOVE" });
    },
    [log, pushHistory, update],
  );

  const undo = useCallback(() => {
    const stack = historyRef.current;
    if (stack.length === 0) return false;
    const snapshot = stack[stack.length - 1]!;
    historyRef.current = stack.slice(0, -1);
    setUndoCount(historyRef.current.length);
    setState({ ...snapshot, phaseBeforePause: null });
    log({ eventType: "ROLLBACK" });
    return true;
  }, [log]);

  const continuePlay = useCallback(() => {
    update((prev) => ({ ...prev, phase: "PLAYER_TURN", notice: null }));
    endTurn();
  }, [endTurn, update]);

  const dismissNotice = useCallback(() => {
    update((prev) => (prev.notice ? { ...prev, notice: null } : prev));
  }, [update]);

  const endGame = useCallback(async () => {
    const current = stateRef.current;
    if (!current) return;
    update((prev) => ({ ...prev, phase: "GAME_COMPLETE" }));
    await safe(() => gameService.saveGameResults({ ...current, phase: "GAME_COMPLETE" }));
  }, [safe, update]);

  const discard = useCallback(() => {
    historyRef.current = [];
    setUndoCount(0);
    setState(null);
    storeState(null);
  }, []);

  const remainingForCurrentSquare = useMemo(() => {
    if (!state?.currentSquareTheme || !state.currentSquareDifficulty) return 0;
    return poolFor(
      bank,
      state.currentSquareTheme,
      state.currentSquareDifficulty,
      state.usedQuestionIds,
    ).length;
  }, [bank, state]);

  const questionsRemaining = bank.length - (state?.usedQuestionIds.length ?? 0);

  return {
    state,
    bank,
    bankError,
    currentPlayer,
    undoCount,
    questionsRemaining,
    remainingForCurrentSquare,
    board: state?.board ?? BOARD_POSITIONS,
    startGame,
    resumeStored,
    move,
    selectAnswer,
    timeout,
    continueAfterReveal,
    pause,
    resume,
    tick,
    differentQuestion,
    skipQuestion,
    fallbackQuestion,
    resetUsedQuestions,
    selectPlayer,
    manualMove,
    renamePlayer,
    renameGame,
    removePlayer,
    undo,
    endTurn,
    continuePlay,
    dismissNotice,
    endGame,
    discard,
  };
}
