'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import TicketCard from '@/components/ticket-card';
import SidebarFilters from '@/components/sidebar-filters';
import TicketForm from '@/components/ticket-form';
import { Ticket } from '@/lib/types';

const API_KEY = 'clawbridge-baugpt-2026';

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({ status: '', creator: '' });
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const LIMIT = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch status counts (unfiltered)
  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets?key=${API_KEY}&limit=100`);
      if (!res.ok) return;
      const data = await res.json();
      const counts: Record<string, number> = {};
      (data.tickets || []).forEach((t: Ticket) => { counts[t.status] = (counts[t.status] || 0) + 1; });
      setStatusCounts(counts);
    } catch { /* silent */ }
  }, []);

  const fetchTickets = useCallback(async (append = false) => {
    try {
      setError(null);
      if (append) setLoadingMore(true); else setLoading(true);

      const currentOffset = append ? offset : 0;
      const params = new URLSearchParams({ key: API_KEY, limit: String(LIMIT), offset: String(currentOffset) });
      if (filters.status) params.set('status', filters.status);
      if (filters.creator) params.set('creator', filters.creator);
      if (searchDebounced) params.set('search', searchDebounced);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`/api/tickets?${params}`, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      if (append) {
        setTickets(prev => [...prev, ...(data.tickets || [])]);
      } else {
        setTickets(data.tickets || []);
      }
      setTotal(data.total || 0);
      setOffset(currentOffset + LIMIT);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message.includes('abort') ? 'Timeout — Verbindung zu langsam. Bitte neu laden.' : `Fehler: ${message}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, searchDebounced, offset]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  useEffect(() => { setOffset(0); fetchTickets(false); }, [filters, searchDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasMore = tickets.length < total;
  const allCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900">🌉 ClawBridge</h1>
            <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{total} Tickets</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setOffset(0); fetchTickets(false); fetchCounts(); }}
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors" title="Refresh">
              ↻
            </button>
            <Link href="/settings"
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors" title="Settings">
              ⚙️
            </Link>
            <button onClick={() => setShowForm(true)}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors shadow-sm">
              + Neues Ticket
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        <SidebarFilters
          filters={filters}
          onChange={(f) => { setFilters(f); setOffset(0); }}
          statusCounts={statusCounts}
          totalCount={allCount}
        />

        <main className="flex-1 min-w-0">
          {/* Search */}
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
            <input
              placeholder="Tickets durchsuchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-300 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-sm">
                ✕
              </button>
            )}
          </div>

          {/* Active filters pills (mobile) */}
          {(filters.status || filters.creator) && (
            <div className="flex flex-wrap gap-2 mb-4 md:hidden">
              {filters.status && (
                <span className="inline-flex items-center gap-1 text-xs bg-zinc-900 text-white px-2.5 py-1 rounded-full">
                  {filters.status}
                  <button onClick={() => setFilters({ ...filters, status: '' })} className="ml-1 hover:text-zinc-300">✕</button>
                </span>
              )}
              {filters.creator && (
                <span className="inline-flex items-center gap-1 text-xs bg-zinc-900 text-white px-2.5 py-1 rounded-full">
                  {filters.creator}
                  <button onClick={() => setFilters({ ...filters, creator: '' })} className="ml-1 hover:text-zinc-300">✕</button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-zinc-400">
              <div className="inline-block w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mb-3"></div>
              <p className="text-sm">Lade Tickets...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">⚠️</p>
              <p className="text-red-500 font-medium text-sm">{error}</p>
              <button onClick={() => { setOffset(0); fetchTickets(false); }}
                className="mt-4 px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
                Erneut versuchen
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">
              <p className="text-4xl mb-3">🌉</p>
              <p className="text-sm">{filters.status || filters.creator || searchDebounced ? 'Keine Tickets mit diesen Filtern.' : 'Noch keine Tickets. Erstelle eins!'}</p>
              {(filters.status || filters.creator || searchDebounced) && (
                <button onClick={() => { setFilters({ status: '', creator: '' }); setSearch(''); }}
                  className="mt-3 text-sm text-zinc-500 hover:text-zinc-700 underline">Filter zurücksetzen</button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map(t => <TicketCard key={t.id} ticket={t} />)}
              {hasMore && (
                <button onClick={() => fetchTickets(true)} disabled={loadingMore}
                  className="w-full py-3 text-sm text-zinc-500 border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 transition-colors disabled:opacity-50 mt-2">
                  {loadingMore ? 'Lädt...' : `Mehr laden (${tickets.length} von ${total})`}
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {showForm && <TicketForm onClose={() => setShowForm(false)} onCreated={() => { setOffset(0); fetchTickets(false); fetchCounts(); }} />}

      <Link href="/help"
        className="fixed bottom-6 right-6 w-11 h-11 bg-zinc-900 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg hover:bg-zinc-700 hover:scale-105 transition-all z-50"
        title="Hilfe">
        ?
      </Link>
    </div>
  );
}
