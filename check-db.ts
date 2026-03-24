import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase.from('monitoring_configs').select('id, title, agent_type, location').limit(5);
  console.log("Error:", error);
  console.log("Data:", data);
}
check();
