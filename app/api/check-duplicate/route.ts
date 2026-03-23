import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export const maxDuration = 10;

/**
 * GET /api/check-duplicate?key=...&title=...
 * Pre-flight check: returns similar open/in-progress tickets before creating a new one.
 * Agents should call this before POST /api/tickets.
 */
export async function GET(req: NextRequest) {
  const authError = checkAuth(req);
  if (authError) return authError;

  const { searchParams } = req.nextUrl;
  const title = searchParams.get('title') || '';

  if (!title.trim()) {
    return NextResponse.json({ duplicates: [], message: 'No title provided' });
  }

  const words = title.trim().toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (words.length === 0) {
    return NextResponse.json({ duplicates: [], message: 'Title too short to check' });
  }

  try {
    const likeClause = words.map((_, i) => `(LOWER(title) LIKE $${i + 1})`).join(' OR ');
    const likeParams = words.map(w => `%${w}%`);

    const result = await pool.query(
      `SELECT id, title, status, creator_agent, assigned_agents, created_at
       FROM agent_tickets
       WHERE status IN ('open', 'in-progress', 'waiting')
       AND (${likeClause})
       ORDER BY created_at DESC LIMIT 5`,
      likeParams
    );

    return NextResponse.json({
      duplicates: result.rows,
      count: result.rows.length,
      is_duplicate: result.rows.length > 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
