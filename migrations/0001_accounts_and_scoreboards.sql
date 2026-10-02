-- Apply after enabling Neon Auth and the Neon Data API on the same branch.
-- Neon Auth owns neon_auth; the application never writes to that schema.
CREATE TABLE IF NOT EXISTS public.scoreboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL DEFAULT (auth.user_id()),
  title text NOT NULL DEFAULT 'Bridgette’s Strikes',
  pitchers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scoreboards_title_length CHECK (length(title) BETWEEN 1 AND 100),
  CONSTRAINT scoreboards_pitchers_array CHECK (jsonb_typeof(pitchers) = 'array')
);

CREATE INDEX IF NOT EXISTS scoreboards_owner_updated_idx
  ON public.scoreboards (owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.scoreboard_shares (
  scoreboard_id uuid NOT NULL REFERENCES public.scoreboards(id) ON DELETE CASCADE,
  strikee_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scoreboard_id, strikee_email),
  CONSTRAINT scoreboard_shares_email_normalized CHECK (strikee_email = lower(btrim(strikee_email))),
  CONSTRAINT scoreboard_shares_email_not_empty CHECK (length(strikee_email) BETWEEN 3 AND 320)
);

CREATE INDEX IF NOT EXISTS scoreboard_shares_recipient_email_idx
  ON public.scoreboard_shares (strikee_email);

ALTER TABLE public.scoreboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoreboard_shares ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;
REVOKE ALL ON public.scoreboards, public.scoreboard_shares FROM PUBLIC, anon;
GRANT SELECT, INSERT ON public.scoreboards TO authenticated;
GRANT UPDATE (pitchers, updated_at) ON public.scoreboards TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.scoreboard_shares TO authenticated;

-- Keep share lookups out of the scoreboards RLS subquery to prevent recursive RLS.
CREATE OR REPLACE FUNCTION public.is_scoreboard_strikee(target_scoreboard_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.scoreboard_shares AS s
    WHERE s.scoreboard_id = target_scoreboard_id
      AND s.strikee_email = lower(auth.session()->>'email')
  );
$$;

REVOKE ALL ON FUNCTION public.is_scoreboard_strikee(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_scoreboard_strikee(uuid) TO authenticated;

CREATE POLICY scoreboards_read_owner_or_strikee ON public.scoreboards
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.user_id()) = owner_id
    OR (SELECT public.is_scoreboard_strikee(scoreboards.id))
  );

CREATE POLICY scoreboards_create_for_self ON public.scoreboards
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.user_id()) = owner_id);

CREATE POLICY scoreboards_update_owner_or_strikee ON public.scoreboards
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.user_id()) = owner_id
    OR (SELECT public.is_scoreboard_strikee(scoreboards.id))
  )
  WITH CHECK (
    (SELECT auth.user_id()) = owner_id
    OR (SELECT public.is_scoreboard_strikee(scoreboards.id))
  );

CREATE POLICY scoreboard_shares_read_owner_or_strikee ON public.scoreboard_shares
  FOR SELECT TO authenticated
  USING (
    strikee_email = lower(auth.session()->>'email')
    OR EXISTS (
      SELECT 1 FROM public.scoreboards AS b
      WHERE b.id = scoreboard_shares.scoreboard_id
        AND b.owner_id = (SELECT auth.user_id())
    )
  );

CREATE POLICY scoreboard_shares_create_by_owner ON public.scoreboard_shares
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scoreboards AS b
      WHERE b.id = scoreboard_shares.scoreboard_id
        AND b.owner_id = (SELECT auth.user_id())
    )
  );

CREATE POLICY scoreboard_shares_delete_by_owner ON public.scoreboard_shares
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scoreboards AS b
      WHERE b.id = scoreboard_shares.scoreboard_id
        AND b.owner_id = (SELECT auth.user_id())
    )
  );
