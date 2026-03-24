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
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (data && data[0]) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data found in monitoring_configs");
  }
}

check();
