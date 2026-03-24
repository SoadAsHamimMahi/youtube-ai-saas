require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const nodemailer = require('nodemailer');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log("🔍 Testing Manual Trigger Logic...");
  console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    // 1. Get an agent
    const { data: agents, error } = await supabase.from('monitoring_configs').select('*').limit(1);
    if (error || !agents.length) throw new Error("No agents found in DB");
    
    const agent = agents[0];
    console.log(`🤖 Testing Agent: ${agent.title}`);
    console.log(`🏷️ Queries: ${agent.queries.join(', ')}`);
    
    // 2. Fetch videos
    console.log("🎥 Fetching YouTube videos (last 48h)...");
    const publishedAfter = new Date();
    publishedAfter.setHours(publishedAfter.getHours() - 48);
    const timestamp = publishedAfter.toISOString();

    const res = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        key: process.env.YOUTUBE_API_KEY,
        q: agent.queries[0],
        part: "snippet",
        type: "video",
        order: "viewCount",
        maxResults: 5,
        publishedAfter: timestamp,
      },
    });

    const videos = res.data.items || [];
    console.log(`✅ Found ${videos.length} videos.`);

    if (videos.length > 0) {
      // 3. Send Email
      console.log(`📤 Sending Test Email to: ${agent.recipient_email}...`);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { 
          user: process.env.GMAIL_USER, 
          pass: process.env.GMAIL_PASS 
        },
      });

      await transporter.sendMail({
        from: `"YouTube AI Monitor 🤖" <${process.env.GMAIL_USER}>`,
        to: agent.recipient_email,
        subject: `🧪 Test: ${agent.title} — Manual Trigger Success!`,
        text: `The manual trigger button is WORKING!\n\nFound these videos for your first query:\n` + 
              videos.map((v, i) => `${i+1}. ${v.snippet.title}`).join('\n')
      });
      console.log("✅ EMAIL SENT SUCCESSFULLY!");
    } else {
      console.log("⚠️ No videos found for the test.");
    }

  } catch (err) {
    console.error("❌ TEST FAILED:", err.message);
  }
}

test();
