'use client';

import Link from 'next/link';
import { AGENTS, STATUS_COLORS, PRIORITY_ICONS } from '@/lib/agents';
import { Ticket } from '@/lib/types';

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'gerade eben';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `vor ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  return `vor ${days}d`;
}

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const creator = AGENTS[ticket.creator_agent] || { name: ticket.creator_agent, emoji: '🤖', color: '#666' };
  const assigned = ticket.assigned_agents
    .map(a => a === 'all' ? 'Alle' : AGENTS[a]?.name || a)
    .join(', ');

  return (
    <Link href={`/tickets/${ticket.id}`} className="block group">
      <div className={`rounded-xl p-4 transition-all bg-white border hover:shadow-md ${
        ticket.status === 'done' ? 'border-zinc-100 opacity-60 hover:opacity-100' : 'border-zinc-200 hover:border-zinc-300'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status]}`}>
                {ticket.status}
              </span>
              <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${
                ticket.priority === 'urgent' ? 'bg-red-50 text-red-600 border border-red-200' :
                ticket.priority === 'high' ? 'bg-orange-50 text-orange-600 border border-orange-200' : ''
              }`}>
                {(ticket.priority === 'urgent' || ticket.priority === 'high') && `${PRIORITY_ICONS[ticket.priority]} ${ticket.priority}`}
              </span>
            </div>
            <h3 className={`font-semibold text-[15px] leading-snug group-hover:text-zinc-900 ${
              ticket.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-800'
            }`}>{ticket.title}</h3>
            {ticket.description && (
              <p className="text-sm text-zinc-400 mt-1 line-clamp-1">{ticket.description.slice(0, 120)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            {creator.emoji} {creator.name}
          </span>
          <span>→</span>
          <span>{assigned}</span>
          <span className="ml-auto flex items-center gap-3">
            {Number(ticket.reply_count) > 0 && <span>💬 {ticket.reply_count}</span>}
            <span>{timeAgo(ticket.created_at)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
