-- Add instant_runs_used to profiles to track weekly usage
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instant_runs_used INTEGER DEFAULT 0;

-- Comment for clarity
COMMENT ON COLUMN public.profiles.instant_runs_used IS 'Tracks how many instant triggers a free user has used this week. Resets every 7 days.';
