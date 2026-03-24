import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase
    .from('monitoring_configs')
    .select('id, title, last_run_at, agent_type, last_run_status');

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.table(data);
}

check();
