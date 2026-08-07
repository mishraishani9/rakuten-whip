CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id text NOT NULL UNIQUE,
  record_type text NOT NULL DEFAULT 'Generated',
  difficulty text NOT NULL,
  theme text NOT NULL,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL,
  correct_answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX questions_theme_difficulty_idx ON public.questions (theme, difficulty);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO anon, authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_public_all" ON public.questions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.games (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_name text NOT NULL,
  status text NOT NULL DEFAULT 'configured',
  number_of_players integer NOT NULL DEFAULT 2,
  winner_player_id uuid,
  total_questions_used integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.games TO anon, authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games_public_all" ON public.games FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.players (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_number integer NOT NULL,
  player_name text NOT NULL,
  pawn_color text NOT NULL DEFAULT '#2563eb',
  final_position integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  incorrect_answers integer NOT NULL DEFAULT 0,
  timeouts integer NOT NULL DEFAULT 0,
  bonus_count integer NOT NULL DEFAULT 0,
  club_count integer NOT NULL DEFAULT 0,
  bar_count integer NOT NULL DEFAULT 0,
  jail_count integer NOT NULL DEFAULT 0,
  turns_taken integer NOT NULL DEFAULT 0,
  completed_circuit boolean NOT NULL DEFAULT false,
  final_rank integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX players_game_idx ON public.players (game_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO anon, authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_public_all" ON public.players FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.game_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  position integer,
  dice_value integer,
  theme text,
  difficulty text,
  question_id text,
  is_correct boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX game_events_game_idx ON public.game_events (game_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_events TO anon, authenticated;
GRANT ALL ON public.game_events TO service_role;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_events_public_all" ON public.game_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.question_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  question_record_id text NOT NULL,
  theme text NOT NULL,
  difficulty text NOT NULL,
  selected_option text,
  correct_option text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  is_timeout boolean NOT NULL DEFAULT false,
  position integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX question_results_game_idx ON public.question_results (game_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_results TO anon, authenticated;
GRANT ALL ON public.question_results TO service_role;
ALTER TABLE public.question_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "question_results_public_all" ON public.question_results FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);