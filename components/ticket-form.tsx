'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AGENTS, PRIORITIES, PRIORITY_ICONS } from '@/lib/agents';

interface DuplicateTicket {
  id: string;
  title: string;
  status: string;
  creator_agent: string;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function TicketForm({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assigned, setAssigned] = useState<string[]>(['all']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState<DuplicateTicket[]>([]);
  const [checkingDupe, setCheckingDupe] = useState(false);
  const [forceCreate, setForceCreate] = useState(false);

  const toggleAgent = (agent: string) => {
    if (agent === 'all') { setAssigned(['all']); return; }
    const without = assigned.filter(a => a !== 'all');
    setAssigned(without.includes(agent) ? without.filter(a => a !== agent) : [...without, agent]);
  };

  // Debounced duplicate check as user types title
  const checkDuplicates = useCallback(async (t: string) => {
    if (t.trim().length < 10) { setDuplicates([]); return; }
    setCheckingDupe(true);
    try {
      const res = await fetch(`/api/check-duplicate?key=clawbridge-baugpt-2026&title=${encodeURIComponent(t)}`);
      if (res.ok) {
        const data = await res.json();
        setDuplicates(data.duplicates || []);
        if (data.is_duplicate) setForceCreate(false);
      }
    } catch { /* silent */ } finally {
      setCheckingDupe(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => checkDuplicates(title), 600);
    return () => clearTimeout(timer);
  }, [title, checkDuplicates]);

  const submit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/tickets?key=clawbridge-baugpt-2026', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Agent-Name': 'human' },
        body: JSON.stringify({
          title,
          description,
          category: 'general',
          priority,
          assigned_agents: assigned.length ? assigned : ['all'],
          force: forceCreate,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 409 && err.duplicates) {
          setDuplicates(err.duplicates);
          setError('Ähnliche Tickets gefunden (siehe unten). Bestätige dass es kein Duplikat ist.');
          setForceCreate(true);
          return;
        }
        throw new Error(err.error || `Error ${res.status}`);
      }
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    } finally {
      setSubmitting(false);
    }
  };

  const hasDupes = duplicates.length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-5">
          <h2 className="text-lg font-bold text-zinc-900">Neues Ticket</h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">{error}</div>
          )}

          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Titel *</label>
            <input
              placeholder="Was wird gebraucht?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-300 transition-all"
              autoFocus
            />
            {checkingDupe && <p className="text-xs text-zinc-400 mt-1">Prüfe auf Duplikate...</p>}
          </div>

          {/* Duplicate warning */}
          {hasDupes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-amber-800">⚠️ Ähnliche offene Tickets gefunden:</p>
              {duplicates.map(d => (
                <Link key={d.id} href={`/tickets/${d.id}`} target="_blank"
                  className="flex items-center justify-between bg-white border border-amber-100 rounded-lg px-3 py-2 hover:bg-amber-50 transition-colors group">
                  <div>
                    <p className="text-xs font-medium text-zinc-800 group-hover:text-amber-700">{d.title}</p>
                    <p className="text-[11px] text-zinc-400">{d.creator_agent} · {d.status}</p>
                  </div>
                  <span className="text-xs text-amber-600 ml-2">→ Ansehen</span>
                </Link>
              ))}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={forceCreate} onChange={e => setForceCreate(e.target.checked)}
                  className="rounded border-zinc-300" />
                <span className="text-xs text-amber-700">Kein Duplikat — trotzdem neues Ticket erstellen</span>
              </label>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Beschreibung</label>
            <textarea
              placeholder="Details, Kontext, Links... (Markdown wird unterstützt)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-300 transition-all resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 mb-2 block">Priorität</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                    priority === p
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700'
                  }`}>
                  {PRIORITY_ICONS[p]} {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 mb-2 block">Zuweisen an</label>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => toggleAgent('all')}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                  assigned.includes('all') ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'
                }`}>
                Alle
              </button>
              {Object.entries(AGENTS).filter(([k]) => ['bob','hugo','alfred','rainman','brunhilde','karina'].includes(k)).map(([key, a]) => (
                <button key={key} onClick={() => toggleAgent(key)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                    assigned.includes(key) ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'
                  }`}>
                  {a.emoji} {a.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 px-6 py-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 rounded-lg transition-colors">
            Abbrechen
          </button>
          <button onClick={submit} disabled={submitting || !title.trim() || (hasDupes && !forceCreate)}
            className="px-5 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-40 transition-all shadow-sm">
            {submitting ? 'Erstellt...' : 'Ticket erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}
