# WHIP — Backlog Build: Roles, Board UI, Audio, and Online Game Rooms

## 1. Email delivery (item 1)

Verified: the presenter invite only writes an invite row in the database — no email is ever sent. And the project has no sender domain configured, so app emails cannot go out at all yet (signup confirmations currently use a default Lovable sender).

Steps:
- Set up a sender domain you own (a one-click setup dialog; needs a domain + DNS records).
- Scaffold branded auth emails (signup confirmation, invite, magic link, password reset) styled to the WHIP theme.
- Add real invite sending for: presenter invites from the admin console, and game-room invites (section 4). Both go through the app's email service with a WHIP-branded template.

If you don't have a domain yet, everything else in this plan still ships; invites will queue as in-app links you can copy/share until the domain is verified.

## 2. Role scope (item 2)

- Game History, Analytics, Question Audit, Bulk Upload: visible and usable by presenter AND admin.
- Roles & Identity management: admin only (already admin-gated; will stay hidden from presenters).
- Plain players: New Game / Load Game only, plus their own history.
- Each guarded page keeps a server-checked role gate, not just hidden menu buttons.

## 3. Board UI overhaul (item 3)

- **Colour-coded topics**: each house is filled with its topic colour; no topic text inside the house (fixes the overflow/overlap). A legend sits outside the board mapping colour → topic.
- **Difficulty chip** inside each house: small E / M / H pill (green / amber / red).
- **Balanced sides**: board generation changed so every side carries an equal mix of Easy, Medium and Hard houses instead of one difficulty per side.
- **Light board**: pale board surface with saturated coloured squares, keeping the gold/indigo quiz-show chrome around it.
- **Zoom, pan, 3D rotate**: mouse-wheel/pinch zoom (delta-scaled, cursor-anchored), drag to pan, and tilt/rotate sliders for the isometric view, with a "reset view" button. Works on touch.
- **Rules panels moved outside the board**, stacked on the right: one panel for "?" outcomes by dice value, one for Bonus / Penalty houses.
- **Pawns**: restyled to your reference screenshot — please attach it and I'll match the shape, gloss and shadow; until then they'll be tall glossy 3D tokens with drop shadows and a highlight ring for the active player.
- **Collapsible presenter panel** that slides out to the right edge, with a toggle handle.
- **Layout**: board fills the viewport; the question appears as a top overlay band over the board rather than below it. Responsive down to phone widths and up to desktop (grid → stacked, panel collapses by default on small screens).
- **Audio fix + layering**: current sounds only start on a question and can be blocked until first interaction. New audio manager with distinct loops for (a) splash/home/configuration, (b) gameplay, plus a ticking-clock layer that plays over the gameplay bed while a question is live. Unlocked on first tap, with a persistent mute control.

## 4 & 5 & 6. Game rooms and online players

- **Room creation**: starting a session mints a short room code. URL shape `host/<gameid>` to join and `host/<gameid>/<username>` for a seated player.
- **Player view**: no presenter controls — full-screen board, an on-screen dice they can roll only on their turn, and the answer options. Nothing else.
- **Invites & sharing**: after creation, share the room link via WhatsApp, Teams, copy-link, or email to registered users pulled into the game.
- **Not-logged-in join**: `host/<gameid>` sends them to sign-up, then auto-seats them if a slot is free.
- **Setup change**: when pulling in an existing user by email, the presenter toggles Online / Offline per player. Custom (typed-in) players are always offline.
- **Chat + emojis**: a side chat panel for online players with quick emoji reactions that float over the board.
- **Presenter mode**: a toggle that makes the projected screen render the player view, while the presenter's own screen keeps the control panel.
- **Turn authority stays with the presenter**: online players can only roll and answer when the presenter has given them the turn; pause, undo, skip, manual moves and player removal remain presenter-only.

## Technical notes

- New tables: `game_rooms` (code, game id, host, presenter mode, status), `room_players` (seat, user id or custom name, online flag, invite status), `room_messages` (chat + emoji). RLS: participants read their own room; host/presenter writes game state; grants for authenticated and service_role.
- Realtime: Postgres changes on the room tables drive board sync, dice results, question broadcast and chat. Engine state is written by the presenter's client; player clients are read-only plus a "my roll" / "my answer" intent row the presenter's engine consumes.
- New routes: `src/routes/room.$gameId.tsx` (join/lobby) and `src/routes/room.$gameId.$username.tsx` (player view). Presenter stays on `/play`.
- Board generation in `src/game/config.ts` reworked for per-side difficulty balance; topic colour tokens added to `src/styles.css`.
- New components: `BoardViewport` (zoom/pan/rotate wrapper), `BoardLegend`, `RulesPanels`, `DiceRoller`, `RoomChat`, `ShareRoom`.
- `src/game/audio.ts` becomes a multi-track manager with named loops and a tick overlay.
- Email: sender-domain setup + scaffolded auth templates, plus a transactional template for room and presenter invites.

## Sequencing inside the build

1. Roles scope + email/invite plumbing.
2. Board generation, colours, legend, difficulty chips, light theme, pawns.
3. Viewport (zoom/pan/rotate), full-screen layout, top question overlay, collapsible panel, rules panels.
4. Audio manager.
5. Game rooms: schema, invites/share, player view, chat, presenter mode, slug routes.
