import { NextRequest, NextResponse } from 'next/server';

const API_KEY = 'clawbridge-baugpt-2026';
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:3842';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');

  if (key !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch cron jobs from OpenClaw gateway
    const res = await fetch(`${OPENCLAW_GATEWAY_URL}/api/cron/list`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`OpenClaw API error: ${res.status}`);
    }

    const data = await res.json();

    return NextResponse.json({
      jobs: data.jobs || [],
      total: data.jobs?.length || 0,
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cron jobs' },
      { status: 500 }
    );
  }
}
