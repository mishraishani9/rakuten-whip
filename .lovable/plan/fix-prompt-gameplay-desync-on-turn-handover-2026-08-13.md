# Fix prompt / gameplay desync on turn handover

## The reported bug

On a correct answer the reveal prompt always says "Correct! You get another turn." — even when the player has already used both rolls of the turn. The engine then correctly hands over to the next player, so the message contradicts what happens.

Cause: the reveal message is written when the answer is graded, without checking the 2-roll cap; the cap is only checked later, when Continue is pressed.

Fix: make the reveal message depend on the same condition the handover uses — if the player still has a roll left, say the player continues; if the cap is reached, say "Correct! That was your second roll — turn passes to <next player>."

## Other desyncs found in the same flow (also to fix)

1. **Roll cap only enforced at one door.** Dice rolls are accepted whenever it is the player's turn, and several paths return to "your turn" without going through the cap check: landing on START, a square with no unused questions left, and the bonus-chain limit ("Turn continues"). In those cases a player can roll a third time even though the rules say two. Fix: enforce the cap where the roll is accepted, and when the cap is already spent, hand over instead with a matching message.

2. **Bonus that lands on a penalty square** silently hands the turn to the next player with no prompt at all. Fix: show a short prompt explaining the bonus does not chain into a penalty and that play passes on.

3. **Jail escape** shows "You escaped Jail!" and then passes the turn 1.4s later. The prompt does not say the turn still ends. Fix: state that the pawn is free and the next player rolls.

4. **START prompt** ("Back at START.") does not say whether the player rolls again. Fix: say explicitly that the same player rolls again (or that the turn passes, when the cap is spent).

5. **Skipped-turn prompt** is built only from players skipped in that hop; when the player who was skipped is also the one due next in a 2-player game the wording can read oddly. Fix: always name the player who rolls next in the prompt title.

## Verification

Drive a 2-player game in the browser and walk the sequences below, checking prompt text against actual behaviour each step:

- correct → correct (second roll) → prompt must name handover, board must hand over
- correct → wrong → recede + handover, prompt matches
- landing on START, on a bonus that lands on a penalty, on club, on bar, on jail and escaping
- a square whose category has no unused questions left

## Technical notes

All changes are in `src/game/useGameEngine.ts`:
- extract a single helper (e.g. `hasRollLeft(state)`) used by `finishQuestion`'s notice, `continueAfterReveal`, and `move`'s guard
- helper for the next player's display name so notices can name them
- adjust the notices at the bonus→penalty, jail-escape, START, no-question, bonus-chain-limit, and `endTurn` sites

No schema, service, or component changes needed.
