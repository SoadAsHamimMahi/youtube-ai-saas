# 🎬 YouTube AI Monitor — SaaS Dashboard

A powerful, automated YouTube monitoring SaaS that sends you curated AI-filtered video reports directly to your email on a custom schedule.

🌐 **Live App:** [youtube-ai-saas-blue.vercel.app](https://youtube-ai-saas-blue.vercel.app)

---

## ✨ Features

- 🤖 **AI-Powered Monitoring** — Create multiple "agents" that search YouTube for specific keywords/topics
- 📧 **Scheduled Email Reports** — Receive beautifully formatted email digests at your exact chosen time
- 🌍 **Timezone Support** — Schedule agents in your local timezone (e.g., Asia/Dhaka)
- ✏️ **Edit & Manage Agents** — Create, edit, and delete agents directly from the dashboard
- ⚡ **Manual Trigger** — Send an email report instantly with a single click
- 🔒 **Secure Auth** — User authentication via Supabase
- ⏱️ **Precision Scheduling** — Minute-level accuracy via Vercel + Cron-job.org

---

## 🏗️ Architecture

This project consists of two parts:

```
n8n Email/
├── youtube-ai-saas/     ← Next.js SaaS Dashboard (this repo)
└── youtube-ai-agent/    ← Standalone Node.js worker (GitHub Actions)
```

### How It Works

```
User (Dashboard) → Saves agent config → Supabase DB
                                              ↑
Cron-job.org (every 5 min) → /api/cron → Reads agents → Matches time → YouTube API → Email
```

1. Users create agents with keywords, recipient emails, and a preferred time on the dashboard.
2. Every 5 minutes, Cron-job.org pings the `/api/cron` endpoint on Vercel.
3. The endpoint checks if any active agent's time matches the current time (±10 min window).
4. If matched (and not already run today), it fetches the top YouTube videos and sends the email.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth & DB | Supabase (PostgreSQL + Row Level Security) |
| Styling | Vanilla CSS (Custom glassmorphism dark theme) |
| Email | Nodemailer (Gmail SMTP) |
| YouTube | YouTube Data API v3 |
| Deployment | Vercel |
| Scheduling | Cron-job.org (external) |

---

## ⚙️ Setup & Local Development

### 1. Clone & Install

```bash
git clone https://github.com/SoadAsHamimMahi/youtube-ai-saas.git
cd youtube-ai-saas
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # Required for /api/cron

# YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key

# Gmail (use App Password, not your real password)
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=xxxx xxxx xxxx xxxx

# Cron Security
CRON_SECRET=your_random_secret_string
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deployment (Vercel)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import the repository
3. Add all environment variables from `.env.local` in Vercel → Settings → Environment Variables
4. Deploy ✅

---

## ⏰ Scheduling Setup (Cron-job.org)

For reliable, minute-level email scheduling:

1. Sign up free at [cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - **URL:** `https://your-vercel-domain.com/api/cron?secret=YOUR_CRON_SECRET`
   - **Schedule:** Every 5 minutes
3. Save ✅

The `/api/cron` endpoint will:
- Check all active agents
- Match the current time to agent schedules (±10 minute window)
- Send a "once-per-day" lock to prevent duplicate emails
- Trigger YouTube search + email report for matching agents

---

## 📊 Supabase Schema

The main table `monitoring_configs` stores all agent configurations:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | text | Owner user ID |
| `title` | text | Agent display name |
| `queries` | text[] | YouTube search keywords |
| `preferred_time` | time | Scheduled run time (HH:mm:ss) |
| `timezone` | text | User's timezone (e.g., Asia/Dhaka) |
| `recipient_email` | text | Email to send reports to |
| `max_videos` | integer | Max videos per report |
| `is_active` | boolean | Whether agent is enabled |
| `last_run_at` | timestamptz | Timestamp of last successful run |
| `last_run_status` | text | `success` or `error` |

---

## 📁 Key Files

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx          ← Main dashboard with agent cards
│   │   └── layout.tsx        ← Dashboard sidebar layout
│   ├── api/
│   │   └── cron/route.ts     ← Secure cron trigger endpoint
│   └── actions/
│       └── agent-actions.ts  ← Server actions (create, update, delete, trigger)
├── components/
│   ├── dashboard/
│   │   ├── add-agent-modal.tsx   ← Create agent form
│   │   └── edit-agent-modal.tsx  ← Edit agent form
│   └── layout/
│       └── sidebar.tsx           ← App sidebar
└── lib/
    ├── agent-worker.ts       ← YouTube API + Email logic
    ├── supabase.ts           ← Browser Supabase client
    └── supabase-server.ts    ← Server Supabase client (SSR)
```

---

## 🔐 API Reference

### `GET /api/cron`

Triggers scheduled agent checks. Protected by `CRON_SECRET`.

**Query Params:**
- `secret` — Must match `CRON_SECRET` environment variable

**Example Response:**
```json
{
  "success": true,
  "processed_at": "2026-03-24T14:30:00.000Z",
  "results": [
    { "title": "AI Videos", "status": "triggered" },
    { "title": "Game Videos", "status": "skipped", "reason": "time_mismatch", "current": "20:30", "goal": "18:00" }
  ]
}
```

---

## 📄 License

MIT License — feel free to use and modify.
