import { config } from 'dotenv';
config({ path: '.env.local' });
import { getTopJobs, sendJobEmailReport } from './src/lib/job-worker';

async function testFullFlow() {
  console.log("Starting Full Job Flow Test (Broad Query)...");
  
  try {
    const jobs = await getTopJobs(['Developer'], 'UK', 3);
    console.log(`Found ${jobs.length} jobs.`);
    
    if (jobs.length > 0) {
      console.log("Job Title 1:", jobs[0].title);
      console.log("Attempting to send email to:", process.env.GMAIL_USER);
      await sendJobEmailReport(jobs, process.env.GMAIL_USER!, "TEST Job Agent");
      console.log("✅ Email sent successfully!");
    } else {
      console.log("❌ No jobs found, skipping email.");
    }
  } catch (err: any) {
    console.error("💥 Integration Test Failed:", err.message);
  }
}

testFullFlow();
