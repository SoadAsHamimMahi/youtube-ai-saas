import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all monitoring configs for the user
export async function GET() {
  const { data, error } = await supabase
    .from('monitoring_configs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST a new monitoring config
export async function POST(request: Request) {
  const body = await request.json();
  const { title, queries, preferred_time } = body;

  const { data, error } = await supabase
    .from('monitoring_configs')
    .insert([
      { title, queries, preferred_time, user_id: 'temp-user-id' } // Will replace with Auth user
    ])
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data[0]);
}
