-- Add frequency_days to monitoring_configs to support custom delivery schedules
ALTER TABLE monitoring_configs 
ADD COLUMN IF NOT EXISTS frequency_days INT DEFAULT 1;

-- If a record is missing the column value for some reason, ensure it defaults to daily
UPDATE monitoring_configs 
SET frequency_days = 1 
WHERE frequency_days IS NULL;
