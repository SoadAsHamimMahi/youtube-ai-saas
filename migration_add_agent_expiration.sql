-- Add expires_at to monitoring_configs to support agent duration/stoppage
ALTER TABLE monitoring_configs 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;
