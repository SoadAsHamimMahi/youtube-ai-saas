import { NextResponse } from 'next/server';
import { getTopJobs } from '@/lib/job-worker';
import axios from 'axios';

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
    const agent = await request.json();
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

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
