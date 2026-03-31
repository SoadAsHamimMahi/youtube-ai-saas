-- ============================================================
-- SYSTEM BUG FIX MIGRATIONS
-- Run these in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ----------------------------------------------------------------
-- BUG #2 FIX: Atomic credit deduction to prevent race conditions.
-- Without this, two simultaneous runs can both read the same credit
-- balance and both deduct from it, effectively running for free.
-- This function does a single atomic CHECK + UPDATE in one DB call.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION deduct_credits_and_increment_runs(
  user_id_param UUID,
  credit_cost INT,
  is_free_tier BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    credits = GREATEST(0, credits - credit_cost),
    instant_runs_used = CASE WHEN is_free_tier THEN instant_runs_used + 1 ELSE instant_runs_used END,
    updated_at = NOW()
  WHERE id = user_id_param
    AND credits >= credit_cost; -- Atomic guard: only deducts if credits are sufficient

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits or user not found for user_id: %', user_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ----------------------------------------------------------------
-- BUG #10 FIX: Single batch UPDATE for credit resets.
-- Old code: N sequential DB round-trips (one per user).
-- New code: One SQL statement handles ALL eligible users at once.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION reset_credits_batch(cutoff_ts TIMESTAMPTZ)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    credits = CASE WHEN tier = 'pro' THEN 1000 ELSE 100 END,
    instant_runs_used = 0,
    last_reset_at = last_reset_at + INTERVAL '7 days',
    updated_at = NOW()
  WHERE last_reset_at <= cutoff_ts;

  RAISE NOTICE 'reset_credits_batch: % rows updated', ROW_COUNT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
