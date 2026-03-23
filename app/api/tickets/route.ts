import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export const maxDuration = 10;

export async function GET(req: NextRequest) {
  const authError = checkAuth(req);
  if (authError) return authError;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const creator = searchParams.get('creator');
  const assigned = searchParams.get('assigned');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let whereClause = ' WHERE 1=1';
  const params: string[] = [];
  let i = 1;

  if (status) { whereClause += ` AND t.status = $${i++}`; params.push(status); }
  if (creator) { whereClause += ` AND t.creator_agent = $${i++}`; params.push(creator); }
  if (assigned) { whereClause += ` AND ($${i++} = ANY(t.assigned_agents) OR 'all' = ANY(t.assigned_agents))`; params.push(assigned); }
  if (category) { whereClause += ` AND t.category = $${i++}`; params.push(category); }
  if (search) { whereClause += ` AND (t.title ILIKE $${i} OR t.description ILIKE $${i})`; params.push(`%${search}%`); i++; }

  try {
    const countResult = await pool.query(`SELECT COUNT(*) FROM agent_tickets t${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const query = `
      SELECT t.*, 
        (SELECT COUNT(*) FROM agent_ticket_replies r WHERE r.ticket_id = t.id) as reply_count
      FROM agent_tickets t${whereClause}
      ORDER BY t.created_at DESC LIMIT $${i++} OFFSET $${i++}
    `;
    const result = await pool.query(query, [...params, limit.toString(), offset.toString()]);

    return NextResponse.json({ tickets: result.rows, total }, {
      headers: { 'Cache-Control': 's-maxage=10, stale-while-revalidate=30' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Tickets API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = checkAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const agent = body.creator_agent || req.headers.get('x-agent-name') || 'bob';
    const { title, description, category, priority, assigned_agents, tags } = body;
    const force = body.force === true; // set force:true to bypass duplicate check

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Titel darf nicht leer sein.' }, { status: 400 });
    }

    // Duplicate detection: check for open/in-progress/waiting tickets with similar title
    if (!force) {
      const titleWords = title.trim().toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
      if (titleWords.length > 0) {
        const likeConditions = titleWords.slice(0, 5).map((_: string, i: number) => `t.title ILIKE $${i + 1}`).join(' OR ');
        const likeParams = titleWords.slice(0, 5).map((w: string) => `%${w}%`);

        const dupCheck = await pool.query(
          `SELECT t.id, t.title, t.status, t.creator_agent, t.assigned_agents, t.created_at,
            (SELECT COUNT(*) FROM agent_ticket_replies r WHERE r.ticket_id = t.id) as reply_count
           FROM agent_tickets t
           WHERE t.status IN ('open', 'in-progress', 'waiting') AND (${likeConditions})
           ORDER BY t.created_at DESC LIMIT 5`,
          likeParams
        );

        if (dupCheck.rows.length > 0) {
          return NextResponse.json(
            {
              error: 'Duplicate ticket detected. Similar open tickets already exist. Reply to an existing ticket instead of creating a new one. Set force:true to override.',
              duplicates: dupCheck.rows,
            },
            { status: 409 }
          );
        }
      }
    }

    const result = await pool.query(
      `INSERT INTO agent_tickets (title, description, category, priority, creator_agent, assigned_agents, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title.trim(), description || '', category || 'general', priority || 'medium', agent, assigned_agents || ['all'], tags || []]
    );

    const ticket = result.rows[0];

    // Slack notification
    try {
      const slackToken = process.env.SLACK_BOT_TOKEN;
      const slackChannel = process.env.SLACK_CHANNEL_ID || 'C0ADW49K0TF';
      if (slackToken) {
        const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${slackToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channel: slackChannel,
            text: `🌉 *Neues ClawBridge Ticket*\n*${ticket.title}*\nVon: ${ticket.creator_agent} | Priorität: ${ticket.priority} | Zugewiesen: ${(ticket.assigned_agents || []).join(', ')}\nhttps://clawbridge-sigma.vercel.app/tickets/${ticket.id}`,
          }),
        });
        const slackData = await slackRes.json();
        if (!slackData.ok) {
          console.error('Slack API error:', slackData.error);
        }
      } else {
        console.error('SLACK_BOT_TOKEN not set');
      }
    } catch (slackErr) {
      console.error('Slack notification failed:', slackErr);
    }

    return NextResponse.json(ticket, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Create ticket error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
