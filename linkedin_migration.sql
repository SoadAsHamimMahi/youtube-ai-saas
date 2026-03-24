-- Run this in your Supabase SQL Editor to support Job Agents

ALTER TABLE monitoring_configs
ADD COLUMN agent_type text DEFAULT 'youtube',
ADD COLUMN location text DEFAULT 'Remote';
