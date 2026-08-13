# Fix bonus / penalty squares (stale position bug)

## What I reproduced

On a 24-house board (5 houses per side) house 2 is a "Bonus +3". Driving a real session in the app:

- Dice 2 → pawn lands on house 2, popup "BONUS! Move forward 3 spaces." — correct.
- Dismiss → pawn moves to house 5 — correct — but the **same bonus popup immediately reappears**, the game stays in `BONUS_ACTION`, and the question for house 5 never opens.
- Because the bonus is then applied a second time, the pawn ends up +6 instead of +3.

## Root cause (confirmed)

In `src/game/useGameEngine.ts` the bonus / penalty / "?" handlers compute the destination *inside* a React state-updater function:

```text
let landed = position
update(prev => { ...compute landed here... })   // runs later, not now
resolveLanding(playerId, landed, ...)           // still reads the OLD value
```

React does not run updater functions synchronously, so `landed` (and `won`) still hold the pre-move values when `resolveLanding` is called. The engine therefore re-resolves the *bonus square itself* instead of the destination: a second bonus popup appears, another +3 is scheduled (total +6), and the destination square's question is never presented. The same stale-value pattern exists in the penalty branch and in the "?" event bonus/goto branches.

## The fix

In `src/game/useGameEngine.ts`, for the `bonus`, `penalty` and `event` branches:

1. Read the player's current position from `stateRef.current` and compute the destination (and win check) **synchronously, before** calling `update`.
2. Call `update` with that already-computed destination (pure updater, no mutation of outer variables).
3. Pass the computed destination to `declareWinner` / `resolveLanding`, so the next step always resolves the *new* square.
4. Keep the rule that a bonus/penalty never chains into another bonus/penalty: if the destination is a special square, clear the popup and hand the turn over; keep `MAX_BONUS_CHAIN` as a backstop against repeated resolution.

Resulting sequence, as requested: land on bonus/penalty → 15s popup describing the n-step move → on dismiss (or auto-dismiss) the pawn moves n steps forward/backward → the destination square's question opens and play continues from there.

## Verification

Replay the same scenario in the running app: dice 2 from START on a 24-house board must give exactly one bonus popup, land the pawn on house 5, and open the house-5 question. Also spot-check the penalty square (house 4, −3) and a "?" square.