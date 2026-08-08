import { supabase } from "@/integrations/supabase/client";
import type { GameState } from "@/game/types";

export type RoomSeat = {
  id: string;
  player_number: number;
  display_name: string;
  slug: string;
  email: string | null;
  user_id: string | null;
  is_online: boolean;
  color: string;
  pending_dice: number | null;
  pending_answer: string | null;
};

export type Room = {
  id: string;
  code: string;
  game_id: string | null;
  host_user_id: string;
  presenter_mode: boolean;
  status: string;
  max_players: number;
  snapshot: GameState | null;
};

export type RoomMessage = {
  id: string;
  room_id: string;
  user_id: string | null;
  display_name: string;
  kind: string;
  body: string;
  created_at: string;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeRoomCode(length = 6) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "player"
  );
}

export function roomUrl(code: string, slug?: string) {
  const base = typeof window === "undefined" ? "" : window.location.origin;
  return slug ? `${base}/${code}/${slug}` : `${base}/${code}`;
}

export async function createRoom(input: {
  code: string;
  hostUserId: string;
  gameId: string | null;
  maxPlayers: number;
  seats: Array<{
    player_number: number;
    display_name: string;
    email: string | null;
    user_id: string | null;
    is_online: boolean;
    color: string;
  }>;
}): Promise<Room> {
  const { data, error } = await supabase
    .from("game_rooms")
    .insert({
      code: input.code,
      host_user_id: input.hostUserId,
      game_id: input.gameId,
      max_players: input.maxPlayers,
    })
    .select("*")
    .single();
  if (error) throw error;

  const seats = input.seats.map((s) => ({ ...s, room_id: data.id, slug: slugify(s.display_name) }));
  const { error: seatError } = await supabase.from("room_players").insert(seats);
  if (seatError) throw seatError;
  return data as unknown as Room;
}

export async function fetchRoomByCode(code: string) {
  const { data, error } = await supabase
    .from("game_rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Room) ?? null;
}

export async function fetchSeats(roomId: string) {
  const { data, error } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", roomId)
    .order("player_number");
  if (error) throw error;
  return (data ?? []) as unknown as RoomSeat[];
}

export async function publishSnapshot(roomId: string, snapshot: GameState, presenterMode: boolean) {
  const { error } = await supabase
    .from("game_rooms")
    .update({ snapshot: snapshot as unknown as never, presenter_mode: presenterMode })
    .eq("id", roomId);
  if (error) throw error;
}

/** A remote player claims the first free seat, or re-claims their own. */
export async function claimSeat(roomId: string, userId: string, displayName: string) {
  const seats = await fetchSeats(roomId);
  const mine = seats.find((s) => s.user_id === userId);
  if (mine) return mine;
  const free =
    seats.find((s) => !s.user_id && s.is_online && slugify(s.display_name) === slugify(displayName)) ??
    seats.find((s) => !s.user_id && s.is_online) ??
    seats.find((s) => !s.user_id);
  if (!free) return null;
  const { data, error } = await supabase
    .from("room_players")
    .update({ user_id: userId, is_online: true })
    .eq("id", free.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as RoomSeat;
}

export async function submitDice(seatId: string, dice: number) {
  const { error } = await supabase.from("room_players").update({ pending_dice: dice }).eq("id", seatId);
  if (error) throw error;
}

export async function submitAnswer(seatId: string, option: string) {
  const { error } = await supabase.from("room_players").update({ pending_answer: option }).eq("id", seatId);
  if (error) throw error;
}

export async function clearIntents(seatId: string) {
  await supabase.from("room_players").update({ pending_dice: null, pending_answer: null }).eq("id", seatId);
}

export async function sendMessage(input: {
  roomId: string;
  userId: string;
  displayName: string;
  kind: "chat" | "emoji";
  body: string;
}) {
  const { error } = await supabase.from("room_messages").insert({
    room_id: input.roomId,
    user_id: input.userId,
    display_name: input.displayName,
    kind: input.kind,
    body: input.body,
  });
  if (error) throw error;
}

export async function fetchMessages(roomId: string) {
  const { data, error } = await supabase
    .from("room_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at")
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as RoomMessage[];
}
