CREATE TABLE IF NOT EXISTS public.active_sessions (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_sessions TO authenticated;
GRANT ALL ON public.active_sessions TO service_role;

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own active session"
ON public.active_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
