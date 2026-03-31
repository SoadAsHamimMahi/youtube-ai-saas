/**
 * Rate Limiter Utility
 *
 * Uses Upstash Redis for distributed rate limiting across all serverless instances.
 * Falls back gracefully if Upstash env vars are not configured (e.g., local dev).
 *
 * Setup: Add these to your .env.local:
 *   UPSTASH_REDIS_REST_URL=your_url
 *   UPSTASH_REDIS_REST_TOKEN=your_token
 *
 * Get free tier at: https://upstash.com
 */

import { NextRequest, NextResponse } from 'next/server';

// Lazy-load to avoid crashing if Upstash env vars are missing
let Ratelimit: any;
let Redis: any;

async function getRatelimiter(requestsPerWindow: number, windowSeconds: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Graceful degradation: if Upstash is not configured, allow all requests
  if (!url || !token) {
    console.warn('[RateLimit] Upstash not configured — rate limiting disabled. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
    return null;
  }

  if (!Ratelimit) Ratelimit = (await import('@upstash/ratelimit')).Ratelimit;
  if (!Redis) Redis = (await import('@upstash/redis')).Redis;

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requestsPerWindow, `${windowSeconds}s`),
  });
}

/**
 * Apply rate limiting to an API route handler.
 * @param req - The incoming Next.js request
 * @param opts - { requests: max allowed, windowSec: time window in seconds }
 * @returns null if allowed, NextResponse(429) if blocked
 */
export async function withRateLimit(
  req: NextRequest,
  opts: { requests: number; windowSec: number }
): Promise<NextResponse | null> {
  const limiter = await getRatelimiter(opts.requests, opts.windowSec);
  if (!limiter) return null; // Not configured, allow

  // Use IP address as the identifier (falls back to 'anonymous')
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'anonymous';

  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  return null; // Allowed
}
