import axios from 'axios';
import nodemailer from 'nodemailer';

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  created: string;
}

export async function getTopJobs(skills: string[], location: string = 'Bangladesh', maxResults = 10): Promise<AdzunaJob[]> {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    throw new Error('ADZUNA_APP_ID or ADZUNA_APP_KEY missing in environment variables');
  }

  // Map location to Adzuna's country code
  const countryMap: Record<string, string> = {
    'Bangladesh': 'gb', // Adzuna uses gb as a fallback for broader results
    'India': 'in',
    'USA': 'us',
    'UK': 'gb',
    'Canada': 'ca',
    'Australia': 'au',
    'Remote': 'gb', // Remote jobs are best searched on gb/us
  };
  const country = countryMap[location] || 'gb';
  const query = skills.join(' OR ');

  try {
    const res = await axios.get(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1`,
      {
        params: {
          app_id: ADZUNA_APP_ID,
          app_key: ADZUNA_APP_KEY,
          results_per_page: maxResults,
          what: query,
          where: location !== 'Bangladesh' && location !== 'Remote' ? location : '',
          sort_by: 'date',
          content_type: 'application/json',
        },
      }
    );
    return (res.data.results || []).slice(0, maxResults);
  } catch (e: any) {
    console.error('Adzuna API error:', e.response?.data || e.message);
    return [];
  }
}

export async function sendJobEmailReport(jobs: AdzunaJob[], recipientEmail: string, title: string) {
  if (!GMAIL_USER || !GMAIL_PASS) {
    throw new Error('Gmail credentials missing in environment variables');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });

  const jobRows = jobs.map((job, i) => {
    const salaryText = job.salary_min
      ? `💰 ${Math.round(job.salary_min / 1000)}k–${Math.round((job.salary_max || job.salary_min) / 1000)}k/yr • `
      : '';
    const shortDesc = job.description?.slice(0, 200).replace(/<[^>]+>/g, '') + '...';

    return `
    <div style="margin-bottom: 24px; border-left: 4px solid #6366f1; padding: 16px; background: #f8f9ff; border-radius: 8px;">
      <h3 style="margin: 0 0 6px; font-size: 17px;">
        <a href="${job.redirect_url}" style="color: #4f46e5; text-decoration: none;">${i + 1}. ${job.title}</a>
      </h3>
      <p style="margin: 0 0 6px; font-size: 14px; color: #374151; font-weight: 600;">
        🏢 ${job.company?.display_name || 'Company N/A'} &nbsp;|&nbsp; 📍 ${job.location?.display_name || 'Location N/A'}
      </p>
      <p style="margin: 0 0 10px; font-size: 13px; color: #6b7280;">
        ${salaryText}📅 ${new Date(job.created).toLocaleDateString()}
      </p>
      <p style="margin: 0 0 12px; font-size: 13px; color: #4b5563;">${shortDesc}</p>
      <a href="${job.redirect_url}" style="display: inline-block; padding: 8px 18px; background: #6366f1; color: white; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none;">
        Apply Now →
      </a>
    </div>
  `;
  }).join('');

  await transporter.sendMail({
    from: `"Job AI Monitor 💼" <${GMAIL_USER}>`,
    to: recipientEmail,
    subject: `💼 ${title} — New Job Listings Today`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 640px; margin: auto; background: #fff; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="font-size: 26px; margin: 0; color: #111;">💼 ${title}</h1>
          <p style="color: #6b7280; margin: 6px 0 0;">Daily Job Report — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        ${jobRows}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          Powered by <strong>YouTube AI SaaS Dashboard</strong> — Adzuna Job Intelligence
        </p>
      </div>
    `,
  });
}
