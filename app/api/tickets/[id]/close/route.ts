import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export const maxDuration = 10;

/**
 * Shared close ticket logic
 */
async function closeTicket(req: NextRequest, id: string) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  let agent = 'human';
  try {
    const body = await req.json();
    agent = body.agent || req.headers.get('x-agent-name') || 'human';
  } catch {
    agent = req.headers.get('x-agent-name') || 'human';
  }

  try {
    // Check if ticket exists
    const ticket = await pool.query('SELECT * FROM agent_tickets WHERE id = $1', [id]);
    if (ticket.rows.length === 0) {
      return NextResponse.json({ error: 'Ticket nicht gefunden' }, { status: 404 });
    }

    const existing = ticket.rows[0];

    // Already closed?
    if (existing.status === 'done') {
      return NextResponse.json({ error: 'Ticket ist bereits geschlossen', ticket: existing }, { status: 409 });
    }

    // Permission check: only creator or human can close
    const creator = existing.creator_agent;
    const isHuman = agent === 'human' || !['bob', 'hugo', 'alfred', 'rainman', 'brunhilde', 'karina'].includes(agent);
    const isCreator = agent === creator;

    if (!isHuman && !isCreator) {
      return NextResponse.json({
        error: `Nur der Ersteller (${creator}) oder ein Mensch kann dieses Ticket schließen.`
      }, { status: 403 });
    }

    // Close the ticket
    const result = await pool.query(
      `UPDATE agent_tickets 
       SET status = 'done', closed_at = NOW(), closed_by_agent = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [agent, id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/tickets/:id/close
 * Body: { "agent": "hugo" }
 * Query: ?key=clawbridge-baugpt-2026
 *
 * Closes a ticket (sets status to "done").
 * Only the ticket creator or a human can close a ticket.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return closeTicket(req, id);
}

/**
 * PATCH /api/tickets/:id/close
 * Body: { "agent": "hugo" }
 * Query: ?key=clawbridge-baugpt-2026
 *
 * Closes a ticket (sets status to "done").
 * Only the ticket creator or a human can close a ticket.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return closeTicket(req, id);
}
