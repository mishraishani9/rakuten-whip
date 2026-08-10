import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { BoardLegend } from "@/components/game/BoardLegend";
import { BoardViewport } from "@/components/game/BoardViewport";
import { DiceRoller } from "@/components/game/DiceRoller";
import { GameBoard } from "@/components/game/GameBoard";
import { SoundControls } from "@/components/game/SoundControls";
import { QuestionCard } from "@/components/game/QuestionCard";
import { RoomChat } from "@/components/game/RoomChat";
import { Button } from "@/components/ui/button";
import { gameAudio } from "@/game/audio";
import { BOARD_POSITIONS, GAME_SETTINGS } from "@/game/config";
import type { GameState } from "@/game/types";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  claimSeat,
  fetchRoomByCode,
  fetchSeats,
  submitAnswer,
  submitDice,
  type Room,
  type RoomSeat,
} from "@/services/roomService";

/** Player-only game room view: full-screen board, on-screen dice, answers and chat. */
export function PlayerRoomView({ code, slug }: { code: string; slug?: string }) {
  const auth = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [seat, setSeat] = useState<RoomSeat | null>(null);
  const [seats, setSeats] = useState<RoomSeat[]>([]);
  const [status, setStatus] = useState<string | null>("Loading game room…");
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    gameAudio.setEnabled(soundOn);
  }, [soundOn]);

  const load = useCallback(async () => {
    const found = await fetchRoomByCode(code);
    if (!found) {
      setStatus("That game room does not exist or has ended.");
      return;
    }
    setRoom(found);
    setStatus(null);
    setSeats(await fetchSeats(found.id));
  }, [code]);

  useEffect(() => {
    void load().catch(() => setStatus("The game room could not be loaded."));
  }, [load]);

  // Claim a seat once signed in.
  useEffect(() => {
    if (!room || !auth.user) return;
    void claimSeat(room.id, auth.user.id, slug ?? auth.displayName)
      .then((claimed) => {
        if (claimed) setSeat(claimed);
        else setStatus("This game room is full. Ask the presenter for a seat.");
      })
      .catch(() => setStatus("Your seat could not be claimed."));
  }, [room, auth.user, auth.displayName, slug]);

  // Live snapshot from the presenter.
  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`room-snapshot-${room.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_rooms", filter: `id=eq.${room.id}` },
        (payload) => setRoom(payload.new as unknown as Room),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room?.id]);

  const state: GameState | null = room?.snapshot ?? null;
  const board = state?.board ?? BOARD_POSITIONS;
  const me = state?.players.find((p) => p.number === seat?.player_number) ?? null;
  const isMyTurn = Boolean(me && state?.currentPlayerId === me.id);
  const canRoll =
    isMyTurn && (state?.phase === "PLAYER_TURN" || state?.phase === "READY" || state?.phase === "SPECIAL_EVENT");

  useEffect(() => {
    if (state) gameAudio.playTrack("gameplay");
    else gameAudio.playTrack("menu");
  }, [Boolean(state)]);

  if (!auth.loading && !auth.user) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <section className="stage-backdrop max-w-md rounded-2xl border border-gold/60 p-6 text-center">
          <h1 className="text-gradient-gold font-display text-2xl font-black uppercase tracking-widest">
            Join room {code}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in or create an account to take a seat in this WHIP session.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/auth">Sign in to join</Link>
          </Button>
        </section>
      </main>
    );
  }

  if (status || !state) {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-display text-lg font-black uppercase tracking-widest text-foreground">
            {status ?? "Waiting for the presenter to start the game…"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Room {code}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/60 px-4 py-2 backdrop-blur">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-black uppercase tracking-[0.2em] text-gold">
            {state.gameName} · room {code}
          </p>
          <p className="truncate text-[0.68rem] text-muted-foreground">
            {me ? `You are ${me.name}` : "Spectating"} · turn {state.turnNumber}
          </p>
        </div>
        <SoundControls onEnabledChange={setSoundOn} />
      </header>

      <div className="relative min-h-0 flex-1">
        <BoardViewport>
          <GameBoard
            players={state.players}
            currentPlayerId={state.currentPlayerId}
            activePosition={me?.position ?? null}
            board={board}
            timeRemaining={state.timeRemaining}
            timerTotal={GAME_SETTINGS.QUESTION_TIME_SECONDS}
            timerActive={state.phase === "QUESTION_ACTIVE"}
            gameName={state.gameName}
          />
        </BoardViewport>

        {state.currentQuestion && (
          <div className="absolute inset-x-0 top-0 z-20 mx-auto max-w-3xl p-3">
            <QuestionCard
              variant="player"
              canAnswer={isMyTurn && Boolean(seat)}
              question={state.currentQuestion}
              phase={state.phase}
              timeRemaining={state.timeRemaining}
              selectedOption={state.selectedOption}
              wasTimeout={state.wasTimeout}
              playerName={state.players.find((p) => p.id === state.currentPlayerId)?.name ?? ""}
              playerColor={state.players.find((p) => p.id === state.currentPlayerId)?.color ?? "#000"}
              soundOn={soundOn}
              onSelect={(option) => {
                if (!seat) return;
                void submitAnswer(seat.id, option);
              }}
            />
          </div>
        )}

        <div className="absolute bottom-3 right-3 z-20 flex w-[min(20rem,90vw)] flex-col gap-3">
          {seat && (
            <div className="rounded-2xl border border-border bg-card/85 p-3 backdrop-blur">
              <DiceRoller
                disabled={!canRoll}
                hint={canRoll ? "Your turn — roll to move." : "Waiting for your turn."}
                onRolled={(value) => void submitDice(seat.id, value)}
              />
            </div>
          )}
          <RoomChat
            roomId={room!.id}
            userId={auth.user?.id ?? null}
            displayName={me?.name ?? auth.displayName}
            className="max-h-64 backdrop-blur"
          />
        </div>

        <div className="absolute bottom-3 left-1/2 z-10 hidden w-64 -translate-x-1/2 lg:block">
          <BoardLegend board={board} />
        </div>
      </div>

      <footer className="border-t border-border bg-card/60 px-4 py-1.5 text-[0.66rem] text-muted-foreground">
        {seats.length} seats · {state.players.map((p) => p.name).join(" · ")}
      </footer>
    </div>
  );
}
