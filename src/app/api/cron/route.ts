import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runAgentImmediately } from '@/lib/agent-worker';
import { getTopJobs, sendJobEmailReport } from '@/lib/job-worker';

// Use Service Role Key to bypass RLS for background tasks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CRON_SECRET = process.env.CRON_SECRET;

function getLocalHourAndMinute(timezone: string): { hour: number; minute: number } {
  try {
    const now = new Date();
    // Format as "HH:MM" in the given timezone
    const timeStr = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    });
    // timeStr is always "HH:MM" e.g. "17:45"
    const parts = timeStr.split(':');
    return {
      hour: parseInt(parts[0], 10),
      minute: parseInt(parts[1], 10),
    };
  } catch {
    return { hour: -1, minute: -1 };
  }
}

export async function GET(request: Request) {
  // BUG #7 FIX: Only accept the secret via Authorization header — NOT via URL query param.
  // A URL query param would expose the secret in server logs, proxy logs, and browser history.
  const authHeader = request.headers.get('Authorization');
  const secret = authHeader?.replace('Bearer ', '');

  // 1. Security Check
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // BUG #10 FIX: Use a single batch UPDATE instead of a sequential per-user loop.
  // A loop with N users does N separate DB round-trips. A single SQL call handles all.
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Batch update all eligible users in a single query using conditional SQL
    await supabase.rpc('reset_credits_batch', { cutoff_ts: sevenDaysAgo });

    console.log('♻️ Credit batch reset executed.');
  } catch (resetErr: any) {
    console.error('Credit Reset Error:', resetErr.message);
    // Continue with agent runs even if reset fails
  }

  try {
    // 2. Fetch all active agents
    const { data: agents, error } = await supabase
      .from('monitoring_configs')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    const now = new Date();

    // Determine which agents are due to run right now (time + frequency check)
    const agentsDue = agents.filter((agent) => {
      const tz = (agent.timezone as string) || 'Asia/Dhaka';

      if (agent.last_run_at) {
        const lastRun = new Date(agent.last_run_at as string);
        const hoursSince = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
        const frequencyDays = agent.frequency_days || 1;
        const requiredHours = (frequencyDays * 24) - 6;
        if (hoursSince < requiredHours) return false;
      }

      const { hour: localHour, minute: localMinute } = getLocalHourAndMinute(tz);
      const timeParts = (agent.preferred_time as string).split(':');
      const preferredHour = parseInt(timeParts[0], 10);
      const preferredMinute = parseInt(timeParts[1], 10);
      return localHour === preferredHour && Math.abs(localMinute - preferredMinute) <= 10;
    });

    const skipped = agents.length - agentsDue.length;
    console.log(`[Cron] ${agentsDue.length} agent(s) due to run, ${skipped} skipped.`);

    // BUG #1 FIX: Process agents in PARALLEL batches of 5 instead of one sequential loop.
    // Sequential processing would timeout on Vercel after ~10 agents.
    // Promise.allSettled captures all results even if individual agents fail.
    const BATCH_SIZE = 5;
    const results: any[] = [];

    for (let i = 0; i < agentsDue.length; i += BATCH_SIZE) {
      const batch = agentsDue.slice(i, i + BATCH_SIZE);
      console.log(`[Cron] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} agents)`);

      const batchResults = await Promise.allSettled(
        batch.map(async (agent) => {
          try {
            await runAgentImmediately(agent.id as string, supabase);
            return { title: agent.title, status: 'triggered', type: agent.agent_type || 'youtube' };
          } catch (err: any) {
            return { title: agent.title, status: 'error', reason: err.message };
          }
        })
      );

      for (const result of batchResults) {
        results.push(result.status === 'fulfilled' ? result.value : { status: 'error', reason: (result as any).reason });
      }
    }

    return NextResponse.json({
      success: true,
      processed_at: now.toISOString(),
      agents_due: agentsDue.length,
      agents_skipped: skipped,
      results,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Cron API Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
