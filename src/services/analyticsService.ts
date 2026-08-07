import type { GameRow, PlayerRow } from "./gameService";

export type LeaderRow = {
  name: string;
  correct: number;
  incorrect: number;
  timeouts: number;
  bonuses: number;
  club: number;
  bar: number;
  jail: number;
  games: number;
  wins: number;
  accuracy: number;
};

export function buildLeaderboard(games: GameRow[], players: PlayerRow[]): LeaderRow[] {
  const winnerIds = new Set(games.map((g) => g.winner_player_id).filter(Boolean) as string[]);
  const map = new Map<string, LeaderRow>();
  for (const p of players) {
    const key = p.player_name.trim().toLowerCase() || `player ${p.player_number}`;
    const row =
      map.get(key) ??
      {
        name: p.player_name || `Player ${p.player_number}`,
        correct: 0,
        incorrect: 0,
        timeouts: 0,
        bonuses: 0,
        club: 0,
        bar: 0,
        jail: 0,
        games: 0,
        wins: 0,
        accuracy: 0,
      };
    row.correct += p.correct_answers;
    row.incorrect += p.incorrect_answers;
    row.timeouts += p.timeouts;
    row.bonuses += p.bonus_count;
    row.club += p.club_count;
    row.bar += p.bar_count;
    row.jail += p.jail_count;
    row.games += 1;
    if (winnerIds.has(p.id)) row.wins += 1;
    map.set(key, row);
  }
  return [...map.values()]
    .map((r) => {
      const answered = r.correct + r.incorrect;
      return { ...r, accuracy: answered === 0 ? 0 : Math.round((r.correct / answered) * 100) };
    })
    .sort((a, b) => b.correct - a.correct || b.accuracy - a.accuracy);
}

export function summarise(games: GameRow[], players: PlayerRow[]) {
  const correct = players.reduce((sum, p) => sum + p.correct_answers, 0);
  const incorrect = players.reduce((sum, p) => sum + p.incorrect_answers, 0);
  const answered = correct + incorrect;
  return {
    games: games.length,
    players: players.length,
    questionsUsed: games.reduce((sum, g) => sum + g.total_questions_used, 0),
    questionsAnswered: answered,
    accuracy: answered === 0 ? 0 : Math.round((correct / answered) * 100),
    timeouts: players.reduce((sum, p) => sum + p.timeouts, 0),
    bonuses: players.reduce((sum, p) => sum + p.bonus_count, 0),
    club: players.reduce((sum, p) => sum + p.club_count, 0),
    bar: players.reduce((sum, p) => sum + p.bar_count, 0),
    jail: players.reduce((sum, p) => sum + p.jail_count, 0),
  };
}