CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.game_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  host_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presenter_mode boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open',
  max_players integer NOT NULL DEFAULT 10,
  snapshot jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_rooms TO authenticated;
GRANT ALL ON public.game_rooms TO service_role;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms readable by authenticated" ON public.game_rooms
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "host creates room" ON public.game_rooms
  FOR INSERT TO authenticated WITH CHECK (host_user_id = auth.uid());
CREATE POLICY "host updates room" ON public.game_rooms
  FOR UPDATE TO authenticated USING (host_user_id = auth.uid()) WITH CHECK (host_user_id = auth.uid());
CREATE POLICY "host deletes room" ON public.game_rooms
  FOR DELETE TO authenticated USING (host_user_id = auth.uid());

CREATE TABLE public.room_players (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  player_number integer NOT NULL,
  display_name text NOT NULL,
  slug text NOT NULL,
  email text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_online boolean NOT NULL DEFAULT false,
  color text NOT NULL DEFAULT '#2563eb',
  pending_dice integer,
  pending_answer text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (room_id, player_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_players TO authenticated;
GRANT ALL ON public.room_players TO service_role;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seats readable by authenticated" ON public.room_players
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "host manages seats" ON public.room_players
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.game_rooms r WHERE r.id = room_id AND r.host_user_id = auth.uid()));
CREATE POLICY "host deletes seats" ON public.room_players
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.game_rooms r WHERE r.id = room_id AND r.host_user_id = auth.uid()));
CREATE POLICY "host or seat owner updates seat" ON public.room_players
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IS NULL
    OR EXISTS (SELECT 1 FROM public.game_rooms r WHERE r.id = room_id AND r.host_user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.game_rooms r WHERE r.id = room_id AND r.host_user_id = auth.uid())
  );

CREATE TABLE public.room_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  kind text NOT NULL DEFAULT 'chat',
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.room_messages TO authenticated;
GRANT ALL ON public.room_messages TO service_role;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages readable by authenticated" ON public.room_messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "own messages insert" ON public.room_messages
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "host or author deletes messages" ON public.room_messages
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.game_rooms r WHERE r.id = room_id AND r.host_user_id = auth.uid())
  );

CREATE TRIGGER update_game_rooms_updated_at BEFORE UPDATE ON public.game_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_room_players_updated_at BEFORE UPDATE ON public.room_players
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;