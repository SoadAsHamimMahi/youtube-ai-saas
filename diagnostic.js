const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
  console.log('--- DIAGNOSTIC SCRIPT ---');
  
  // 1. Check if agent_logs table exists and has rows
  const { data: logs, error: logsError } = await supabase
    .from('agent_logs')
    .select('*')
    .limit(5);

  if (logsError) {
    console.error('ERROR querying agent_logs:', logsError);
  } else {
    console.log(`Found ${logs.length} logs in agent_logs table.`);
    console.log(logs);
  }

  // 2. Count total successes
  const { count, error: countError } = await supabase
    .from('agent_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'success');
    
  if (countError) {
    console.error('ERROR counting agent_logs:', countError);
  } else {
    console.log(`Total successful reports across all users: ${count}`);
  }

  // 3. Let's see monitoring_configs
  const { count: configsCount } = await supabase
    .from('monitoring_configs')
    .select('*', { count: 'exact', head: true });
    
  console.log(`Total configs in DB: ${configsCount}`);
}

checkData();
