import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runAgentImmediately } from '@/lib/agent-worker';

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
      const tz = (agent.timezone as string) || 'Asia/Dhaka';

      // Check if already ran today (within the last 18 hours)
      if (agent.last_run_at) {
        const lastRun = new Date(agent.last_run_at as string);
        const hoursSince = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 18) {
          results.push({ title: agent.title, status: 'skipped', reason: 'already_ran_today' });
          continue;
        }
      }

      // Get current time in agent's timezone
      const { hour: localHour, minute: localMinute } = getLocalHourAndMinute(tz);

      // Parse preferred_time e.g. "17:30:00"
      const timeParts = (agent.preferred_time as string).split(':');
      const preferredHour = parseInt(timeParts[0], 10);
      const preferredMinute = parseInt(timeParts[1], 10);

      const isCorrectHour = localHour === preferredHour;
      const isCorrectMinute = Math.abs(localMinute - preferredMinute) <= 10;

      if (isCorrectHour && isCorrectMinute) {
        console.log(`🚀 Triggering: ${agent.title}`);
        
        // LOCK: Mark as running immediately to prevent duplicate triggers
        // This is done BEFORE sending the email so if cron fires again in 5 min,
        // the "already_ran_today" check will catch it.
        await supabase
          .from('monitoring_configs')
          .update({ last_run_at: now.toISOString(), last_run_status: 'success' })
          .eq('id', agent.id);

        await runAgentImmediately(agent.id as string, supabase);
        results.push({ title: agent.title, status: 'triggered' });
      } else {
        results.push({
          title: agent.title,
          status: 'skipped',
          reason: 'time_mismatch',
          current: `${localHour}:${localMinute}`,
          goal: `${preferredHour}:${preferredMinute}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed_at: now.toISOString(),
      results,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Cron API Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
