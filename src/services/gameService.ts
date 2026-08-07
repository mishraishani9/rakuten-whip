import { supabase } from "@/integrations/supabase/client";
import type { GameState, PlayerState } from "@/game/types";

export type GameRow = {
  id: string;
  game_name: string;
  status: string;
  number_of_players: number;
  winner_player_id: string | null;
  total_questions_used: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

export type PlayerRow = {
  id: string;
  game_id: string;
  player_number: number;
  player_name: string;
  pawn_color: string;
  final_position: number;
  correct_answers: number;
  incorrect_answers: number;
  timeouts: number;
  bonus_count: number;
  club_count: number;
  bar_count: number;
  jail_count: number;
  turns_taken: number;
  completed_circuit: boolean;
  final_rank: number | null;
};

export async function createGame(gameName: string, players: PlayerState[]) {
  const { data: game, error } = await supabase
    .from("games")
    .insert({
      game_name: gameName,
      status: "in_progress",
      number_of_players: players.length,
      started_at: new Date().toISOString(),
    } as never)
    .select()
    .single();
  if (error) throw error;
  const gameRow = game as unknown as GameRow;

  const { data: inserted, error: playerError } = await supabase
    .from("players")
    .insert(
      players.map((p) => ({
        game_id: gameRow.id,
        player_number: p.number,
        player_name: p.name,
        pawn_color: p.color,
      })) as never,
    )
    .select();
  if (playerError) throw playerError;

  const rows = (inserted ?? []) as unknown as PlayerRow[];
  const map = new Map(rows.map((r) => [r.player_number, r.id]));
  return { gameId: gameRow.id, dbIdByNumber: map };
}

export async function renameGame(gameId: string, gameName: string) {
  const { error } = await supabase.from("games").update({ game_name: gameName } as never).eq("id", gameId);
  if (error) throw error;
}

export async function renamePlayer(playerDbId: string, name: string) {
  const { error } = await supabase.from("players").update({ player_name: name } as never).eq("id", playerDbId);
  if (error) throw error;
}

export type EventPayload = {
  gameId: string;
  playerDbId?: string;
  eventType: string;
  position?: number;
  diceValue?: number;
  theme?: string;
  difficulty?: string;
  questionId?: string;
  isCorrect?: boolean;
};

export async function logEvent(payload: EventPayload) {
  const { error } = await supabase.from("game_events").insert({
    game_id: payload.gameId,
    player_id: payload.playerDbId ?? null,
    event_type: payload.eventType,
    position: payload.position ?? null,
    dice_value: payload.diceValue ?? null,
    theme: payload.theme ?? null,
    difficulty: payload.difficulty ?? null,
    question_id: payload.questionId ?? null,
    is_correct: payload.isCorrect ?? null,
  } as never);
  if (error) throw error;
}

export type QuestionResultPayload = {
  gameId: string;
  playerDbId?: string;
  questionRecordId: string;
  theme: string;
  difficulty: string;
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
  isTimeout: boolean;
  position: number;
};

export async function logQuestionResult(payload: QuestionResultPayload) {
  const { error } = await supabase.from("question_results").insert({
    game_id: payload.gameId,
    player_id: payload.playerDbId ?? null,
    question_record_id: payload.questionRecordId,
    theme: payload.theme,
    difficulty: payload.difficulty,
    selected_option: payload.selectedOption,
    correct_option: payload.correctOption,
    is_correct: payload.isCorrect,
    is_timeout: payload.isTimeout,
    position: payload.position,
  } as never);
  if (error) throw error;
}

export async function saveGameResults(state: GameState) {
  if (!state.gameId) return;
  const ranked = [...state.players].sort((a, b) => {
    if (b.laps !== a.laps) return b.laps - a.laps;
    if (b.correct !== a.correct) return b.correct - a.correct;
    return b.position - a.position;
  });

  for (let i = 0; i < ranked.length; i++) {
    const p = ranked[i]!;
    if (!p.dbId) continue;
    const { error } = await supabase
      .from("players")
      .update({
        player_name: p.name,
        final_position: p.position,
        correct_answers: p.correct,
        incorrect_answers: p.incorrect,
        timeouts: p.timeouts,
        bonus_count: p.bonuses,
        club_count: p.club,
        bar_count: p.bar,
        jail_count: p.jail,
        turns_taken: p.turns,
        completed_circuit: p.completedCircuit,
        final_rank: i + 1,
      } as never)
      .eq("id", p.dbId);
    if (error) throw error;
  }

  const winner = state.players.find((p) => p.id === state.winnerIds[0]);
  const { error } = await supabase
    .from("games")
    .update({
      game_name: state.gameName,
      status: "completed",
      ended_at: new Date().toISOString(),
      total_questions_used: state.usedQuestionIds.length,
      winner_player_id: winner?.dbId ?? null,
    } as never)
    .eq("id", state.gameId);
  if (error) throw error;
}

export async function listGames(): Promise<GameRow[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as GameRow[];
}

export async function listPlayers(gameIds?: string[]): Promise<PlayerRow[]> {
  let query = supabase.from("players").select("*").order("player_number");
  if (gameIds && gameIds.length > 0) query = query.in("game_id", gameIds);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as PlayerRow[];
}

export async function deleteGame(gameId: string) {
  const { error } = await supabase.from("games").delete().eq("id", gameId);
  if (error) throw error;
}

export async function gameSummary(gameId: string) {
  const [{ data: game, error: gameError }, players] = await Promise.all([
    supabase.from("games").select("*").eq("id", gameId).single(),
    listPlayers([gameId]),
  ]);
  if (gameError) throw gameError;
  return { game: game as unknown as GameRow, players };
}