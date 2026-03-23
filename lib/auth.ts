import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.CLAWBRIDGE_API_KEY || 'demo';

export function checkAuth(req: NextRequest): NextResponse | null {
  const headerKey = req.headers.get('x-api-key');
  const queryKey = req.nextUrl.searchParams.get('key');

  if (headerKey === API_KEY || queryKey === API_KEY) {
    return null; // authorized
  }

  return NextResponse.json({ error: 'Unauthorized — invalid or missing API key' }, { status: 401 });
}
