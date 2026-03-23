import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await req.json();
    const agent = body.agent || req.headers.get('x-agent-name') || 'bob';

    if (!body.message || !body.message.trim()) {
      return NextResponse.json({ error: 'Nachricht darf nicht leer sein.' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO agent_ticket_replies (ticket_id, agent, message) VALUES ($1, $2, $3) RETURNING *`,
      [id, agent, body.message]
    );

    await pool.query('UPDATE agent_tickets SET updated_at = NOW() WHERE id = $1', [id]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Reply error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
