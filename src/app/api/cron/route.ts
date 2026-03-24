import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runAgentImmediately } from '@/lib/agent-worker';

// Use Service Role Key to bypass RLS for background tasks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('Authorization');
  const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '');

  // 1. Security Check
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Fetch all active agents
    const { data: agents, error } = await supabase
      .from('monitoring_configs')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    const results = [];
    const now = new Date();

    for (const agent of agents) {
      // 3. Time Matching Logic (Same as index.js)
      const tz = agent.timezone || 'Asia/Dhaka';
      
      // Check if it already ran today (within the last 18 hours)
      let alreadyRanToday = false;
      if (agent.last_run_at) {
        const lastRun = new Date(agent.last_run_at);
        const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 18) {
          alreadyRanToday = true;
        }
      }

      if (alreadyRanToday) {
        results.push({ title: agent.title, status: 'skipped', reason: 'already_ran_today' });
        continue;
      }

      // Get current hour and minute in agent's timezone using a safe approach
      const localTimeStr = now.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: tz,
      });
      // localTimeStr will be like "17:45"
      const [localHourStr, localMinuteStr] = localTimeStr.split(':');
      const localHour = parseInt(localHourStr, 10);
      const localMinute = parseInt(localMinuteStr, 10);
      
      const [prefH, prefM] = agent.preferred_time.split(':');
      const preferredHour = parseInt(prefH, 10);
      const preferredMinute = parseInt(prefM, 10);

      const isCorrectHour = localHour === preferredHour;
      // Allow a 10-minute window for the external pinger frequency
      const isCorrectMinute = Math.abs(localMinute - preferredMinute) <= 10;

      if (isCorrectHour && isCorrectMinute) {
        console.log(`🚀 Triggering agent from Cron API: ${agent.title}`);
        await runAgentImmediately(agent.id, supabase);
        results.push({ title: agent.title, status: 'triggered' });
      } else {
        results.push({ title: agent.title, status: 'skipped', reason: 'time_mismatch', current: `${localHour}:${localMinute}`, goal: `${preferredHour}:${preferredMinute}` });
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed_at: now.toISOString(),
      results 
    });

  } catch (err: any) {
    console.error('Cron API Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
