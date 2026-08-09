import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { GameState } from "@/game/types";
import {
  clearIntents,
  createRoom,
  makeRoomCode,
  publishSnapshot,
  type Room,
  type RoomSeat,
} from "@/services/roomService";
import type { SetupPlayer } from "@/game/useGameEngine";

/**
 * Host side of an online game room: creates the room, mirrors the live game
 * state into it, and forwards remote dice rolls / answers into the engine.
 */
export function useRoomHost(options: {
  state: GameState | null;
  hostUserId: string | null;
  presenterMode: boolean;
  onRemoteDice: (playerNumber: number, dice: number) => void;
  onRemoteAnswer: (playerNumber: number, option: "A" | "B" | "C" | "D") => void;
}) {
  const { state, hostUserId, presenterMode } = options;
  const [room, setRoom] = useState<Room | null>(null);
  const [seats, setSeats] = useState<RoomSeat[]>([]);
  const [roomError, setRoomError] = useState<string | null>(null);
  const diceRef = useRef(options.onRemoteDice);
  diceRef.current = options.onRemoteDice;
  const answerRef = useRef(options.onRemoteAnswer);
  answerRef.current = options.onRemoteAnswer;

  const open = useCallback(
    async (players: SetupPlayer[]) => {
      if (!hostUserId) return null;
      try {
        const created = await createRoom({
          code: makeRoomCode(),
          hostUserId,
          gameId: null,
          maxPlayers: Math.max(players.length, 10),
          seats: players.map((p) => ({
            player_number: p.number,
            display_name: p.name,
            email: p.email ?? null,
            user_id: p.userId ?? null,
            is_online: Boolean(p.isOnline),
            color: p.color,
          })),
        });
        setRoom(created);
        setRoomError(null);
        return created;
      } catch {
        setRoomError("The online game room could not be created. Offline play is unaffected.");
        return null;
      }
    },
    [hostUserId],
  );

  const close = useCallback(() => {
    setRoom(null);
    setSeats([]);
  }, []);

  // Mirror the game state into the room so online players stay in sync.
  useEffect(() => {
    if (!room || !state) return;
    const id = window.setTimeout(() => {
      void publishSnapshot(room.id, state, presenterMode).catch(() => undefined);
    }, 180);
    return () => window.clearTimeout(id);
  }, [room, state, presenterMode]);

  // Listen for seat changes: claimed seats and pending player intents.
  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`room-seats-host-${room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${room.id}` },
        (payload) => {
          const seat = payload.new as unknown as RoomSeat | null;
          if (!seat) return;
          setSeats((prev) => {
            const next = prev.filter((s) => s.id !== seat.id);
            return [...next, seat].sort((a, b) => a.player_number - b.player_number);
          });
          if (seat.pending_dice != null) {
            diceRef.current(seat.player_number, seat.pending_dice);
            void clearIntents(seat.id);
          }
          if (seat.pending_answer) {
            answerRef.current(seat.player_number, seat.pending_answer as "A" | "B" | "C" | "D");
            void clearIntents(seat.id);
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room]);

  return { room, seats, roomError, open, close };
}
