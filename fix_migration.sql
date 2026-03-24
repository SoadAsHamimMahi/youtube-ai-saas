-- Run this in your Supabase SQL Editor to fix the 5-minute email bug
-- AND enable the new Confirmation System (Logs & Error reasons)

-- 1. Add tracking columns to monitoring_configs
ALTER TABLE monitoring_configs
ADD COLUMN IF NOT EXISTS last_run_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_run_status text,
ADD COLUMN IF NOT EXISTS last_run_error text;

-- 2. Create a logs table for full history (The "Confirmation System")
CREATE TABLE IF NOT EXISTS agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES monitoring_configs(id) ON DELETE CASCADE,
  run_at timestamp with time zone DEFAULT now(),
  status text NOT NULL, -- 'success' or 'error'
  message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3. Enable RLS on agent_logs if it's new
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own agent logs" 
  ON agent_logs FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM monitoring_configs 
    WHERE id = agent_logs.agent_id AND user_id = auth.uid()
  ));
