import { config } from 'dotenv';
config({ path: '.env.local' });
import { getTopJobs } from './src/lib/job-worker';
import fs from "fs";

async function test() {
  const jobs = await getTopJobs(['Flutter'], 'Bangladesh', 10);
  let str = `TOTAL JOBS FOUND: ${jobs.length}\n`;
  jobs.forEach(j => str += `- ${j.title} | ${j.source} | ${j.apply_url}\n`);
  fs.writeFileSync('output.txt', str);
}
test();
