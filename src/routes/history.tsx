import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { buildLeaderboard, summarise } from "@/services/analyticsService";
import { listGames, listPlayers } from "@/services/gameService";

const TITLE = "Session History & Analytics — Business of IP";
const DESCRIPTION =
  "Review past IP workshop sessions: winners, accuracy, timeouts, bonus squares and a cross-session player leaderboard.";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const games = await listGames();
      const players = await listPlayers(games.map((g) => g.id));
      return { games, players };
    },
  });

  const games = data?.games ?? [];
  const players = data?.players ?? [];
  const totals = summarise(games, players);
  const leaders = buildLeaderboard(games, players);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Link to="/" className="text-sm text-muted-foreground underline hover:text-foreground">
        ← Back to game
      </Link>
      <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-foreground">
        Session history &amp; analytics
      </h1>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading sessions…</p>}
      {error && (
        <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm text-foreground">History is temporarily unavailable.</p>
          <Button size="sm" className="mt-3" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Sessions", value: totals.games },
              { label: "Players", value: totals.players },
              { label: "Questions answered", value: totals.questionsAnswered },
              { label: "Accuracy", value: `${totals.accuracy}%` },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{card.label}</p>
                <p className="mt-1 font-display text-2xl font-black text-foreground">{card.value}</p>
              </div>
            ))}
          </section>

          <h2 className="mt-8 font-display text-lg font-black uppercase tracking-widest text-foreground">
            Player leaderboard
          </h2>
          {leaders.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No completed sessions yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left">Player</th>
                    <th className="p-2 text-right">Games</th>
                    <th className="p-2 text-right">Wins</th>
                    <th className="p-2 text-right">Correct</th>
                    <th className="p-2 text-right">Wrong</th>
                    <th className="p-2 text-right">Timeouts</th>
                    <th className="p-2 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((row) => (
                    <tr key={row.name} className="border-t border-border">
                      <td className="p-2 text-foreground">{row.name}</td>
                      <td className="p-2 text-right tabular-nums">{row.games}</td>
                      <td className="p-2 text-right tabular-nums">{row.wins}</td>
                      <td className="p-2 text-right tabular-nums">{row.correct}</td>
                      <td className="p-2 text-right tabular-nums">{row.incorrect}</td>
                      <td className="p-2 text-right tabular-nums">{row.timeouts}</td>
                      <td className="p-2 text-right tabular-nums">{row.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="mt-8 font-display text-lg font-black uppercase tracking-widest text-foreground">
            Sessions
          </h2>
          <ul className="mt-3 space-y-2">
            {games.map((game) => {
              const roster = players.filter((p) => p.game_id === game.id);
              const winner = roster.find((p) => p.id === game.winner_player_id);
              return (
                <li key={game.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{game.game_name}</p>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {game.status} · {new Date(game.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {game.number_of_players} players · {game.total_questions_used} questions used
                    {winner ? ` · Winner: ${winner.player_name}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}