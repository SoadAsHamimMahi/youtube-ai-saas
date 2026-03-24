import axios from 'axios';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function test() {
  console.log("Testing Adzuna API...");
  console.log("ID:", process.env.ADZUNA_APP_ID);
  
  try {
    const res = await axios.get(
      `https://api.adzuna.com/v1/api/jobs/gb/search/1`,
      {
        params: {
          app_id: process.env.ADZUNA_APP_ID,
          app_key: process.env.ADZUNA_APP_KEY,
          results_per_page: 2,
          what: 'React',
        },
      }
    );
    console.log("Success! Found jobs:", res.data.results.length);
  } catch (err: any) {
    console.error("Failed:", err.response?.data || err.message);
  }
}
test();
