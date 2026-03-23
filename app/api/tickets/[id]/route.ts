import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export const maxDuration = 10;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  const { id } = await params;
  try {
    const ticket = await pool.query('SELECT * FROM agent_tickets WHERE id = $1', [id]);
    if (ticket.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const replies = await pool.query(
      'SELECT * FROM agent_ticket_replies WHERE ticket_id = $1 ORDER BY created_at ASC', [id]
    );

    return NextResponse.json({ ...ticket.rows[0], replies: replies.rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  const { id } = await params;
  const body = await req.json();
  const agent = req.headers.get('x-agent-name') || 'human';

  try {
    if (body.status === 'done') {
      const ticket = await pool.query('SELECT creator_agent FROM agent_tickets WHERE id = $1', [id]);
      if (ticket.rows.length === 0) return NextResponse.json({ error: 'Ticket nicht gefunden' }, { status: 404 });

      const creator = ticket.rows[0].creator_agent;
      const isHuman = agent === 'human' || !['bob', 'hugo', 'alfred', 'rainman', 'brunhilde', 'karina'].includes(agent);
      const isCreator = agent === creator;

      if (!isHuman && !isCreator) {
        return NextResponse.json({
          error: `Nur der Ersteller (${creator}) oder ein Mensch kann dieses Ticket schließen.`
        }, { status: 403 });
      }
    }

    const sets: string[] = ['updated_at = NOW()'];
    const vals: (string | null)[] = [];
    let i = 1;

    if (body.status) {
      sets.push(`status = $${i++}`); vals.push(body.status);
      if (body.status === 'done') {
        sets.push(`closed_at = NOW()`);
        sets.push(`closed_by_agent = $${i++}`); vals.push(agent);
      } else {
        sets.push(`closed_at = NULL`);
        sets.push(`closed_by_agent = NULL`);
      }
    }
    if (body.priority) { sets.push(`priority = $${i++}`); vals.push(body.priority); }

    vals.push(id);
    const result = await pool.query(
      `UPDATE agent_tickets SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals
    );
    return NextResponse.json(result.rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
