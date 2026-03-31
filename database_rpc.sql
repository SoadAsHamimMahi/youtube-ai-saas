-- Run this in your Supabase SQL Editor to resolve the Race Condition on Credit Deduction (Bug #1)

CREATE OR REPLACE FUNCTION deduct_credits_and_increment_runs(
  user_id_param UUID,
  credit_cost INT,
  is_free_tier BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    credits = GREATEST(0, credits - credit_cost),
    instant_runs_used = CASE WHEN is_free_tier THEN COALESCE(instant_runs_used, 0) + 1 ELSE instant_runs_used END,
    updated_at = NOW()
  WHERE id = user_id_param;
END;
$$;
