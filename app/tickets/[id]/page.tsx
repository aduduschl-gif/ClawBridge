'use client';

import { useEffect, useState, useCallback } from 'react';
import { use } from 'react';
import Link from 'next/link';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReplyForm from '@/components/reply-form';
import { AGENTS, STATUS_COLORS, PRIORITY_COLORS, STATUSES, STATUS_ICONS } from '@/lib/agents';
import { Ticket } from '@/lib/types';

const API_KEY = 'clawbridge-baugpt-2026';

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'gerade eben';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `vor ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours}h`;
  return `vor ${Math.floor(hours / 24)}d`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TicketDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/tickets/${id}?key=${API_KEY}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      setTicket(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const updateStatus = async (newStatus: string) => {
    if (updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${id}?key=${API_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Agent-Name': 'human' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Fehler beim Status-Update');
        return;
      }
      await fetchTicket();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Fehler');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-400">
      <div className="text-center">
        <div className="inline-block w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mb-3"></div>
        <p className="text-sm">Lade Ticket...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-red-500 font-medium text-sm">{error}</p>
        <button onClick={() => { setLoading(true); fetchTicket(); }}
          className="mt-4 px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
          Erneut versuchen
        </button>
        <div className="mt-3">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700">← Zurück</Link>
        </div>
      </div>
    </div>
  );

  if (!ticket) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-400">
      <p className="text-sm">Ticket nicht gefunden</p>
      <Link href="/" className="ml-3 text-sm text-zinc-500 hover:text-zinc-700 underline">← Zurück</Link>
    </div>
  );

  const creator = AGENTS[ticket.creator_agent] || { name: ticket.creator_agent, emoji: '🤖', color: '#666' };
  const assigned = ticket.assigned_agents
    .map(a => a === 'all' ? 'Alle' : AGENTS[a]?.name || a)
    .join(', ');

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-zinc-700 transition-colors text-sm">← Zurück</Link>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">🌉 ClawBridge</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Ticket Header */}
        <div className="mb-6">
          <h2 className={`text-2xl font-bold mb-3 ${ticket.status === 'done' ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
            {ticket.title}
          </h2>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[ticket.status]}`}>{ticket.status}</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
            <span className="text-sm text-zinc-500">
              {creator.emoji} {creator.name} → {assigned}
            </span>
            <span className="text-xs text-zinc-400">• {formatDate(ticket.created_at)}</span>
          </div>

          {/* Status Buttons */}
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} onClick={() => updateStatus(s)}
                disabled={ticket.status === s || updating}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-medium ${
                  ticket.status === s
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 disabled:opacity-40'
                }`}>
                {STATUS_ICONS[s]} {s === 'done' ? '✓ Schließen' : s}
              </button>
            ))}
          </div>
          {ticket.closed_at && (
            <p className="text-xs text-zinc-400 mt-2">
              Geschlossen von {AGENTS[ticket.closed_by_agent || '']?.name || ticket.closed_by_agent} am {formatDate(ticket.closed_at)}
            </p>
          )}
        </div>

        {/* Description */}
        {ticket.description && (
          <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-8 prose prose-sm prose-zinc max-w-none">
            <Markdown remarkPlugins={[remarkGfm]}>{ticket.description}</Markdown>
          </div>
        )}

        {/* Replies */}
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          💬 Antworten ({ticket.replies?.length || 0})
        </h3>
        <div className="space-y-3 mb-8">
          {ticket.replies && ticket.replies.length > 0 ? (
            ticket.replies.map(reply => {
              const agent = AGENTS[reply.agent] || { name: reply.agent, emoji: '🤖', color: '#666' };
              return (
                <div key={reply.id} className="bg-white border border-zinc-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{agent.emoji}</span>
                    <span className="font-medium text-sm text-zinc-900">{agent.name}</span>
                    <span className="text-xs text-zinc-400">{timeAgo(reply.created_at)}</span>
                    {reply.is_edited && <span className="text-xs text-zinc-300 italic">(bearbeitet)</span>}
                  </div>
                  <div className="prose prose-sm prose-zinc max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>{reply.message}</Markdown>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-zinc-400 py-6 text-center">Noch keine Antworten.</p>
          )}
        </div>

        {/* Reply Form */}
        {ticket.status !== 'done' ? (
          <ReplyForm ticketId={id} onReplied={fetchTicket} />
        ) : (
          <div className="text-center py-4 text-sm text-zinc-400 border border-zinc-200 rounded-xl bg-white">
            Ticket geschlossen — <button onClick={() => updateStatus('open')} className="text-zinc-600 hover:text-zinc-900 underline">wieder öffnen?</button>
          </div>
        )}
      </div>
    </div>
  );
}
