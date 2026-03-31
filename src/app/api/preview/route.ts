import { NextRequest, NextResponse } from 'next/server';
import { getTopJobs } from '@/lib/job-worker';
import axios from 'axios';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { withRateLimit } from '@/lib/rate-limit';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {}
      }
    }
  );
}

async function getTopVideosPreview(queries: string[], maxResults = 10) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const allResults = await Promise.all(
    queries.map(async (q) => {
      try {
        const res = await axios.get("https://www.googleapis.com/youtube/v3/search", {
          params: {
            key: apiKey,
            q,
            part: "snippet",
            type: "video",
            maxResults: 10,
          },
        });
        return res.data.items || [];
      } catch (e) {
        return [];
      }
    })
  );

  return allResults.flat().slice(0, maxResults).map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelName: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.default?.url,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    description: item.snippet.description
  }));
}

export async function POST(request: NextRequest) {
  // SECURITY FIX #3: Rate limit — max 10 preview requests per minute per IP
  const rateLimitResponse = await withRateLimit(request, { requests: 10, windowSec: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = await getSupabase();

    // SECURITY FIX #1: Verify the caller is authenticated before anything else
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, simulate = false } = body;

    if (!agentId || typeof agentId !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid agentId' }, { status: 400 });
    }

    // SECURITY FIX #2 (IDOR): Fetch the agent only if it belongs to this user.
    // Old code: .eq('id', agentId) — anyone could preview any agent by guessing UUIDs.
    // New code: .eq('user_id', user.id) — enforces ownership at the query level.
    const { data: agent, error: agentError } = await supabase
      .from('monitoring_configs')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)  // ← OWNERSHIP CHECK
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ success: false, error: 'Agent not found or access denied' }, { status: 404 });
    }

    // If NOT simulating, try to get the last successful sent report
    if (!simulate) {
      const { data: lastLog, error: logError } = await supabase
        .from('agent_logs')
        .select('*')
        .eq('agent_id', agentId)
        .eq('status', 'success')
        .order('run_at', { ascending: false })
        .limit(1)
        .single();

      if (!logError && lastLog && lastLog.metadata?.results) {
        return NextResponse.json({ 
          success: true, 
          data: lastLog.metadata.results,
          isSimulation: false,
          sentAt: lastLog.run_at 
        });
      }
    }

    // Fallback to live simulation
    let results = [];
    if (agent.agent_type === 'job') {
      results = await getTopJobs(
        agent.queries, 
        agent.location || 'Bangladesh', 
        agent.max_videos || 10
      );
    } else {
      results = await getTopVideosPreview(agent.queries, agent.max_videos || 10);
    }

    return NextResponse.json({ 
      success: true, 
      data: results,
      isSimulation: true 
    });

  } catch (err: any) {
    console.error("Preview API Error:", err.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
