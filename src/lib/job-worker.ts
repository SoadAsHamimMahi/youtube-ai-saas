import axios from 'axios';
import nodemailer from 'nodemailer';
import { getTransporter } from '@/lib/mailer';

interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  apply_url: string;
  posted_at?: string;
  salary?: string;
  source: string; // e.g., "LinkedIn"
}

export async function getTopJobs(skills: string[], location: string = 'Bangladesh', maxResults = 10): Promise<JobResult[]> {
  const apiKey = process.env.SERP_API_KEY;

  if (!apiKey) {
    throw new Error('SERP_API_KEY missing in environment variables');
  }

  const fetchJobs = async (loc: string, customQuery?: string): Promise<JobResult[]> => {
    const query = customQuery || `${skills.join(' ')} jobs in ${loc}`;
    try {
      console.log(`[JobWorker] Searching Google Jobs via SerpApi: ${query}`);
      const res = await axios.get(`https://serpapi.com/search`, {
        params: {
          engine: "google_jobs",
          q: query,
          hl: "en",
          chips: "date_posted:month", // Keep month to see up to 30 days
          api_key: apiKey,
        }
      });

      const results = res.data.jobs_results || [];
      console.log(`[JobWorker] Found ${results.length} total jobs for query: ${query} in ${loc}.`);

      return results
        .map((job: any) => {
          // Find apply link (we prioritize LinkedIn, but gracefully fall back to native source like Indeed)
          const applyLinks = job.apply_options || job.related_links || [];
          const linkedinLinkObj = applyLinks.find((l: any) => 
            l.text?.toLowerCase().includes('linkedin') || 
            l.title?.toLowerCase().includes('linkedin') || 
            l.link?.toLowerCase().includes('linkedin.com')
          );
          
          let finalLink = null;
          let finalSourceName = '';

          if (linkedinLinkObj) {
            finalLink = linkedinLinkObj.link;
            finalSourceName = 'LinkedIn';
          } else if (applyLinks.length > 0 && applyLinks[0].link) {
            finalLink = applyLinks[0].link;
            finalSourceName = applyLinks[0].title || applyLinks[0].text || 'Site';
          }

          // If there is literally no application link provided by Google, skip the job (no fake searches)
          if (!finalLink) return null;

          // Filter out explicitly old jobs (years/etc)
          const postedAt = job.detected_extensions?.posted_at?.toLowerCase() || '';
          if (postedAt.includes('year')) {
            return null;
          }

          // 30-day strict filtering (Relaxed from 15 days)
          const daysMatch = postedAt.match(/(\d+)\s+days?/);
          if (daysMatch) {
            const days = parseInt(daysMatch[1], 10);
            if (days > 30) return null;
          }
          
          const weeksMatch = postedAt.match(/(\d+)\s+weeks?/);
          if (weeksMatch) {
            const weeks = parseInt(weeksMatch[1], 10);
            if (weeks > 4) return null;
          }

          const monthsMatch = postedAt.match(/(\d+)\s+months?/);
          if (monthsMatch) {
            const months = parseInt(monthsMatch[1], 10);
            if (months > 1) return null;
          }

          return {
            id: job.job_id,
            title: job.title,
            company: job.company_name,
            location: job.location,
            description: job.description,
            apply_url: finalLink,
            posted_at: job.detected_extensions?.posted_at,
            salary: job.detected_extensions?.salary,
            source: job.via?.replace('via ', '') || finalSourceName
          };
        })
        .filter((j: any) => j !== null);
    } catch (e: any) {
      console.error(`[JobWorker] SerpApi error for ${loc}:`, e.response?.data || e.message);
      return [];
    }
  };

  // 1. Initial search (Specific skills)
  const primaryJobs = await fetchJobs(location);
  let allJobs = [...primaryJobs];

  // 2. Broadening: If we still don't have enough local jobs, try broader keywords (e.g., skip some specific skills)
  if (allJobs.length < 5 && skills.length > 1) {
    console.log(`[JobWorker] Low results (${allJobs.length}). Broadening local search...`);
    // Example broad search: Just the first skill (usually the most important)
    const broaderJobs = await fetchJobs(location, `${skills[0]} jobs in ${location}`);
    for (const bj of broaderJobs) {
      if (allJobs.length >= maxResults) break;
      if (!allJobs.find(j => j.company === bj.company && j.title === bj.title)) {
        allJobs.push(bj);
      }
    }
  }

  // 3. Fallback: If we still haven't met the target, fill with global Remote jobs
  if (allJobs.length < maxResults && location.toLowerCase() !== 'remote') {
    console.log(`[JobWorker] Only found ${allJobs.length}/${maxResults} jobs. Filling with Remote global jobs.`);
    const remoteQuery = `${skills.join(' ')} Remote jobs`;
    const fallbackJobs = await fetchJobs('Remote', remoteQuery);
    
    // Add fallback jobs, ensuring no duplicates
    for (const fbJob of fallbackJobs) {
      if (allJobs.length >= maxResults) break;
      if (!allJobs.find(j => j.company === fbJob.company && j.title === fbJob.title)) {
        allJobs.push(fbJob);
      }
    }
  }

  return allJobs.slice(0, maxResults);
}

export async function sendJobEmailReport(jobs: JobResult[], recipientEmail: string, title: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;

  if (!gmailUser || !gmailPass) {
    throw new Error('Gmail credentials missing in environment variables');
  }

  const transporter = getTransporter();

  const jobRows = jobs.map((job, i) => {
    const salaryTag = job.salary 
      ? `<span style="display:inline-block; background:#ecfdf5; color:#059669; padding:2px 8px; border-radius:4px; font-weight:700; margin-right:8px;">💰 ${job.salary}</span>`
      : "";
    const sourceTag = `<span style="display:inline-block; background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-weight:700;">🌐 ${job.source}</span>`;
    
    const shortDesc = job.description?.slice(0, 250).replace(/<[^>]+>/g, '') + '...';
    
    let buttonText = "Apply Now →";
    if (job.source.toLowerCase().includes('linkedin') || job.apply_url.includes('linkedin.com')) {
      buttonText = "Find on LinkedIn →";
    } else if (job.source) {
      buttonText = `Apply on ${job.source} →`;
    }

    return `
    <div style="margin-bottom: 24px; border: 1px solid #e5e7eb; padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      <h3 style="margin: 0 0 8px; font-size: 18px;">
        <a href="${job.apply_url}" style="color: #1d4ed8; text-decoration: none; font-weight: 800;">${i + 1}. ${job.title}</a>
      </h3>
      <div style="margin-bottom: 10px; font-size: 14px; color: #4b5563; font-weight: 600;">
        🏢 ${job.company} &nbsp;|&nbsp; 📍 ${job.location}
      </div>
      <div style="margin-bottom: 12px; font-size: 12px;">
        ${salaryTag} ${sourceTag} &nbsp;|&nbsp; 📅 ${job.posted_at || 'Recently'}
      </div>
      <p style="margin: 0 0 16px; font-size: 13px; color: #374151; line-height: 1.5; background: #f9fafb; padding: 10px; border-radius: 6px;">
        ${shortDesc}
      </p>
      <a href="${job.apply_url}" style="display: inline-block; padding: 10px 22px; background: #0077b5; color: white; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none;">
        ${buttonText}
      </a>
    </div>
  `;
  }).join('');

  await transporter.sendMail({
    from: `"LinkedIn Job Monitor 💼" <${gmailUser}>`,
    to: recipientEmail,
    subject: `💼 ${title} — New Opportunities in ${new Date().toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 640px; margin: auto; background: #f3f4f6; padding: 20px;">
        <div style="background: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; padding: 8px 16px; background: #0077b5; color: white; border-radius: 20px; font-weight: 800; font-size: 12px; text-transform: uppercase; margin-bottom: 12px;">LinkedIn Integrated</div>
            <h1 style="font-size: 28px; margin: 0; color: #111827; letter-spacing: -0.025em;">${title}</h1>
            <p style="color: #6b7280; margin: 8px 0 0; font-size: 15px;">Targeted Job Alerts for your Skills</p>
          </div>
          
          ${jobRows}
          
          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">
              Powered by <strong>SerpApi</strong> & <strong>YouTube AI SaaS</strong>
            </p>
            <p style="font-size: 11px; color: #d1d5db;">You are receiving this because of your Job Monitor configuration.</p>
          </div>
        </div>
      </div>
    `,
  });
}
