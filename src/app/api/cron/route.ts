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
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('Authorization');
  const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '');

  // 1. Security Check
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1b. Automated Credit Reset (Every 7 Days)
  // This resets credits to tier defaults if now() >= last_reset_at + 7 days
  try {
    const { data: profilesToReset } = await supabase
      .from('profiles')
      .select('id, tier, last_reset_at')
      .lte('last_reset_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (profilesToReset && profilesToReset.length > 0) {
      console.log(`♻️ Resetting credits for ${profilesToReset.length} users...`);
      for (const profile of profilesToReset) {
        const defaultCredits = profile.tier === 'pro' ? 1000 : 100;
        
        // Calculate next reset date precisely (last_reset + 7 days)
        const oldReset = new Date(profile.last_reset_at);
        const nextReset = new Date(oldReset.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        await supabase
          .from('profiles')
          .update({ 
            credits: defaultCredits, 
            instant_runs_used: 0,
            last_reset_at: nextReset,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
      }
    }
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

    const results = [];
    const now = new Date();

    for (const agent of agents) {
      const tz = (agent.timezone as string) || 'Asia/Dhaka';

      // Check frequency schedule prevent early runs
      if (agent.last_run_at) {
        const lastRun = new Date(agent.last_run_at as string);
        const hoursSince = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
        
        // Calculate required hours based on frequency (daily=1, 3 days=3, weekly=7)
        // We subtract 6 hours from the total to give leeway for exact cron trigger timings and timezone boundaries
        const frequencyDays = agent.frequency_days || 1;
        const requiredHours = (frequencyDays * 24) - 6;

        if (hoursSince < requiredHours) {
          results.push({ title: agent.title, status: 'skipped', reason: `frequency_not_met_wait_${frequencyDays}_days` });
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
        console.log(`🚀 Triggering: ${agent.title} (type: ${agent.agent_type || 'youtube'})`);
        
        try {
          await runAgentImmediately(agent.id as string, supabase);
          results.push({ title: agent.title, status: 'triggered', type: agent.agent_type || 'youtube' });
        } catch (err: any) {
           results.push({ title: agent.title, status: 'error', reason: err.message });
        }
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
