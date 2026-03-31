import { NextResponse } from 'next/server';

// This endpoint has been intentionally disabled for security reasons.
// It was a legacy endpoint with no authentication checks.
// All agent management is now handled via authenticated Server Actions in:
// src/app/actions/agent-actions.ts
export async function GET() {
  return NextResponse.json({ error: 'This endpoint is deprecated. Use the dashboard.' }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: 'This endpoint is deprecated. Use the dashboard.' }, { status: 410 });
}
