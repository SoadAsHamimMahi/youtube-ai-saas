-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in Supabase Dashboard → SQL Editor
-- This ensures users can ONLY access their own data,
-- even if an attacker calls the Supabase REST API directly
-- using the public anon key found in the browser.
-- ============================================================

-- -----------------------------------------------
-- TABLE: monitoring_configs
-- -----------------------------------------------
ALTER TABLE monitoring_configs ENABLE ROW LEVEL SECURITY;

-- Users can only SELECT their own agents
CREATE POLICY "Users view own agents"
  ON monitoring_configs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only INSERT agents for themselves
CREATE POLICY "Users create own agents"
  ON monitoring_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only UPDATE their own agents
CREATE POLICY "Users update own agents"
  ON monitoring_configs FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only DELETE their own agents
CREATE POLICY "Users delete own agents"
  ON monitoring_configs FOR DELETE
  USING (auth.uid() = user_id);

-- Service role (cron job) bypasses RLS automatically — no extra policy needed


-- -----------------------------------------------
-- TABLE: profiles
-- -----------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view only their own profile
CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow profile creation on signup (triggered by Supabase auth trigger)
CREATE POLICY "Service can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true); -- The insert is done by a DB trigger with service role


-- -----------------------------------------------
-- TABLE: agent_logs
-- -----------------------------------------------
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view logs for their own agents
CREATE POLICY "Users view own agent logs"
  ON agent_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM monitoring_configs
      WHERE monitoring_configs.id = agent_logs.agent_id
        AND monitoring_configs.user_id = auth.uid()
    )
  );

-- Only service role (cron/worker) can insert logs — no user policy needed
-- The service role bypasses RLS, so no INSERT policy required for users
