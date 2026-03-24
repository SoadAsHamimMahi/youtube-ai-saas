import axios from 'axios';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function discover() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const country = 'gb';

  const scenarios = [
    { name: "Standard with params", url: `https://api.adzuna.com/v1/api/jobs/${country}/search/1`, params: { app_id: appId, app_key: appKey, what: 'javascript' } },
    { name: "Simplified no country search", url: `https://api.adzuna.com/v1/api/jobs/gb/search/1`, params: { app_id: appId, app_key: appKey, what: 'javascript' } },
    { name: "USA country search", url: `https://api.adzuna.com/v1/api/jobs/us/search/1`, params: { app_id: appId, app_key: appKey, what: 'javascript' } },
  ];

  for (const s of scenarios) {
    try {
      console.log(`Testing: ${s.name}...`);
      const res = await axios.get(s.url, { params: s.params, headers: { 'Accept': 'application/json' } });
      console.log(`✅ Success! Found ${res.data.results?.length} jobs.`);
      break;
    } catch (err: any) {
      console.error(`❌ Failed ${s.name}:`, err.response?.status, err.message);
      if (err.response?.data && typeof err.response.data === 'string' && err.response.data.includes('<html')) {
          console.log("Response was HTML (likely 400/404/503)");
      } else if (err.response?.data) {
          console.log("Error details:", JSON.stringify(err.response.data).slice(0, 200));
      }
    }
  }
}
discover();
