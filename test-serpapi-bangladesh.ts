import { config } from 'dotenv';
config({ path: '.env.local' });
import { getTopJobs, sendJobEmailReport } from './src/lib/job-worker';

async function testSerpApiBangladesh() {
  console.log("🚀 Starting SerpApi Bangladesh Job Test...");
  console.log("SERP_API_KEY:", process.env.SERP_API_KEY ? "EXISTS" : "MISSING");
  
  try {
    // Testing specific Bangladesh query
    const jobs = await getTopJobs(['React Developer'], 'Bangladesh', 5);
    console.log(`✅ Found ${jobs.length} jobs in Bangladesh.`);
    
    if (jobs.length > 0) {
      console.log("Sample Job:", jobs[0].title, "at", jobs[0].company, `(${jobs[0].source})`);
      console.log("Attempting to send email to:", process.env.GMAIL_USER);
      
      await sendJobEmailReport(jobs, process.env.GMAIL_USER!, "Bangladesh Job Monitor (LinkedIn)");
      console.log("🎉 SUCCESS! Check your email for the Bangladesh LinkedIn jobs report.");
    } else {
      console.log("❌ No jobs found for this query in Bangladesh.");
    }
  } catch (err: any) {
    console.error("💥 Test Failed:", err.message);
  }
}

testSerpApiBangladesh();
