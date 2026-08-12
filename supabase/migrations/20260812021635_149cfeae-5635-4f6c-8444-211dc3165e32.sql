ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS under_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_reason text,
  ADD COLUMN IF NOT EXISTS flagged_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS flagged_by uuid;

CREATE INDEX IF NOT EXISTS questions_under_review_idx ON public.questions (under_review);