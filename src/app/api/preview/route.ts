import { NextResponse } from 'next/server';
import { getTopJobs } from '@/lib/job-worker';
import axios from 'axios';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentId, simulate = false } = body;

    const supabase = await getSupabase();

    // 1. Fetch Agent Config
    const { data: agent, error: agentError } = await supabase
      .from('monitoring_configs')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    // 2. If NOT simulating, try to get the last successful sent report
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

    // 3. Fallback to live simulation
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
