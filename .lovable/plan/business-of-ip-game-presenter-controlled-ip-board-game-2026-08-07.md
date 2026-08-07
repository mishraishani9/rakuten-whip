# Business of IP Game — presenter-controlled IP board game

An offline, single-screen board game for IP awareness workshops. The presenter drives everything: picks the player, types the physical dice value, reveals answers, and manages the game. Lovable Cloud stores the question bank, game history, and analytics.

## What gets built

**Home dashboard** — "BUSINESS OF IP GAME", subtitle, four actions (Create New Game, Load Previous Game, Question Bank, Analytics) and summary cards (Questions / Games Played / Players).

**New game setup** — editable game name (defaults to `Business of IP Game - <date time>`), 2–10 players, auto-assigned pawn colors, editable names, Start Game.

**Game board** — 24 perimeter squares in a CSS-grid square board inspired by classic property boards (own artwork, no Monopoly assets). Corners: START (0), CLUB (6), BAR (12), JAIL (18). Between them: 18 question squares showing THEME + DIFFICULTY, 2 bonus squares, 3 event ("?") squares. Layout is fixed for the whole game and lives in one config file.

**Pawns** — colored pawns similar to chess to give a 3D feel, distinct colors, name label, animated movement, offset when sharing a square, glow when selected.

**Presenter panel** — current player, dice input (1–6, validated, no auto-roll), MOVE, compact clickable player list, live status (turn number, questions answered/remaining, game time) and per-player stats (correct / incorrect / timeouts / bonus / club / bar / jail / position).

**Question flow** — the landing square's theme + difficulty selects a random *unused* question for this session; 15s countdown; presenter clicks an option → orange → reveal (green correct, red wrong) with ✓ CORRECT / ✕ INCORRECT text so color is never the only signal. Correct = same player keeps the turn (presenter enters the next dice value). Wrong or timeout = next eligible player.

**Special squares** — Bonus auto-advances and re-evaluates the landing square (max 1 bonus chain per turn). "?" outcome is driven by the dice value that landed the player there, via a configurable `EVENT_RULES` map. CLUB = miss 1 turn, BAR = miss 2 turns, JAIL = must roll 1 or 6 to escape (configurable).

**Game controls (expandable)** — Pause (full-screen GAME PAUSED overlay; timer resumes at the exact remaining second), Different Question, Skip Question, Manual Move, Rename Player, Rename Game, and Undo Last Move with a 5-deep rollback stack showing remaining undos.

**Winner + end** — winner modal on completing the circuit back to START, with that player's stats and END & SAVE / CONTINUE PLAY. END GAME asks for confirmation, then persists the aggregated game, players, events and question results.

**Game history** — list of past games (name, date, players, winner, status) with View Results, Rename, and confirmed Delete. Completed games open as read-only results; only in-progress games offer Resume, so nothing is faked.

**Question bank** — counts by difficulty, theme distribution, searchable/filterable paginated list, CSV template download, and a drag-and-drop bulk upload that validates columns and rows, reports valid/invalid/duplicate counts with row-level errors, previews before import, and appends by default (Replace Existing Bank behind a confirmation).

**Analytics** — filter by all games or selected games, leaderboard by correct answers with accuracy, plus totals for questions answered, timeouts, bonuses, club/bar/jail visits, games played and wins.

## Question selection rule

Per game session: `usedQuestionIds` starts empty; each pick filters by the square's theme group + difficulty, excludes used IDs, picks randomly, then marks it used. Never repeats within a game; a new game makes everything eligible again. When a combination is exhausted the presenter is offered another difficulty in the same theme, another theme, skip, or reset used questions — never an automatic repeat.

## Technical notes

- Data: the supplied 1,550-question CSV is seeded into a `questions` table via a migration containing literal INSERTs (50 Golden + 1,500 generated; 514 Easy / 521 Medium / 515 Hard), with `record_id` unique.
- Tables: `questions`, `games`, `players`, `game_events`, `question_results` — with grants and RLS policies allowing public workshop use; no login.
- The dataset has 42 raw themes (e.g. "Patentability", "SEPs & standards", "Prior art"). Board squares use ~9 board categories (Patent, Trademark, IP Fundamentals, Prior Art, Inventorship, Patentability, Trade Secrets, SEPs & Standards, Copyright), each mapping to a list of raw themes in config so filtering always finds questions.
- Central config module: `BOARD_POSITIONS`, `EVENT_RULES`, `GAME_SETTINGS` (15s timer, 10 players, 5 rollbacks, 1 bonus chain), plus the theme-group map.
- Live game state is a frontend reducer implementing the state machine (SETUP → READY → PLAYER_TURN → MOVING → QUESTION_ACTIVE → ANSWER_SELECTED → ANSWER_REVEALED → BONUS_ACTION → SPECIAL_EVENT → PAUSED → WINNER → GAME_COMPLETE); contradictory actions are blocked. Nothing is written per timer tick — persistence happens at creation, on completed questions and significant events, and on save/end. If the backend is unreachable the game keeps playing and shows a non-blocking warning.
- Services: `questionService`, `gameService`, `analyticsService`, `csvService`; components split as listed in the brief. No online multiplayer, auth, chat, or AI — the architecture stays modular so multiplayer can be added later.
- Design: premium corporate-playful design system in `src/styles.css` (semantic tokens only), tuned for projector legibility on desktop/tablet.

## Build order

1. Cloud + schema + CSV seed migration
2. Home, setup, board, pawns, dice, movement, question engine, timer, turn logic
3. Pause, bonus, events, club/bar/jail, winner, admin controls, rollback
4. Persistence + game history
5. CSV upload, question bank browser, analytics
6. Walk the 20 acceptance tests and fix gameplay/state issues