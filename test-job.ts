import { config } from 'dotenv';
config({ path: '.env.local' });
import { getTopJobs } from './src/lib/job-worker';

async function test() {
  console.log("APP_ID:", process.env.ADZUNA_APP_ID);
  try {
    const jobs = await getTopJobs(['React'], 'Remote', 5);
    console.log("Jobs found:", jobs.length);
    console.log(jobs[0]);
  } catch (err) {
    console.error("Test failed:", err);
  }
}
test();
