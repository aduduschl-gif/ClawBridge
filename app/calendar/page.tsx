'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CronJob {
  id: string;
  agentId: string;
  name: string;
  enabled: boolean;
  schedule: {
    kind: string;
    everyMs?: number;
    expr?: string;
    tz?: string;
  };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
    consecutiveErrors?: number;
  };
  payload: {
    model?: string;
    timeoutSeconds?: number;
  };
}

const API_KEY = 'clawbridge-baugpt-2026';

function formatSchedule(schedule: CronJob['schedule']): string {
  if (schedule.kind === 'cron') {
    return `Cron: ${schedule.expr}${schedule.tz ? ` (${schedule.tz})` : ''}`;
  }
  if (schedule.kind === 'every' && schedule.everyMs) {
    const mins = Math.round(schedule.everyMs / 60000);
    const hours = Math.round(mins / 60);
    if (mins < 60) return `Every ${mins} min`;
    if (hours < 24) return `Every ${hours}h`;
    return `Every ${Math.round(hours / 24)}d`;
  }
  return schedule.kind;
}

function formatNextRun(ms?: number): string {
  if (!ms) return '—';
  const d = new Date(ms);
  const now = Date.now();
  const diff = ms - now;
  
  if (diff < 0) return 'Überfällig';
  if (diff < 3600000) return `in ${Math.round(diff / 60000)} min`;
  if (diff < 86400000) return `in ${Math.round(diff / 3600000)}h`;
  
  return d.toLocaleString('de-DE', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function formatDuration(ms?: number): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}m`;
}

const agentEmojis: Record<string, string> = {
  bob: '👨‍💻',
  hugo: '🚀',
  alfred: '🐸',
  rainman: '👨🏻‍🔧',
  brunhilde: '👩‍💻',
  main: '⚙️',
};

const statusColors: Record<string, string> = {
  ok: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  running: 'bg-blue-100 text-blue-700',
};

export default function CalendarPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchJobs() {
    try {
      setError(null);
      const res = await fetch(`/api/calendar?key=${API_KEY}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Fehler: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = filter
    ? jobs.filter(j => j.agentId === filter)
    : jobs;

  const enabledJobs = filteredJobs.filter(j => j.enabled);
  const disabledJobs = filteredJobs.filter(j => !j.enabled);

  const agentCounts = jobs.reduce((acc, j) => {
    acc[j.agentId] = (acc[j.agentId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900 hover:text-zinc-600 transition-colors">
              🌉 ClawBridge
            </Link>
            <span className="text-zinc-300">/</span>
            <h1 className="text-lg font-semibold text-zinc-700">📅 Agent Calendar</h1>
            <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
              {jobs.length} Jobs
            </span>
          </div>
          <button
            onClick={fetchJobs}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        {/* Sidebar — Agent Filter */}
        <aside className="w-60 flex-shrink-0 space-y-1 hidden md:block">
          <button
            onClick={() => setFilter('')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filter === ''
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <span className="mr-2">📊</span>
            Alle Agents
            <span className="ml-auto float-right text-xs opacity-70">{jobs.length}</span>
          </button>
          {Object.entries(agentCounts).map(([agent, count]) => (
            <button
              key={agent}
              onClick={() => setFilter(agent)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === agent
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <span className="mr-2">{agentEmojis[agent] || '🤖'}</span>
              {agent}
              <span className="ml-auto float-right text-xs opacity-70">{count}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="text-center py-20 text-zinc-400">
              <div className="inline-block w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mb-3"></div>
              <p className="text-sm">Lade Cron Jobs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">⚠️</p>
              <p className="text-red-500 font-medium text-sm">{error}</p>
              <button
                onClick={fetchJobs}
                className="mt-4 px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Enabled Jobs */}
              {enabledJobs.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-zinc-500 mb-3 uppercase tracking-wide">
                    Aktive Jobs ({enabledJobs.length})
                  </h2>
                  <div className="space-y-2">
                    {enabledJobs.map(job => (
                      <div
                        key={job.id}
                        className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{agentEmojis[job.agentId] || '🤖'}</span>
                            <div>
                              <h3 className="font-semibold text-zinc-900">{job.name}</h3>
                              <p className="text-xs text-zinc-500">{job.agentId}</p>
                            </div>
                          </div>
                          {job.state?.lastStatus && (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                statusColors[job.state.lastStatus] || 'bg-zinc-100 text-zinc-600'
                              }`}
                            >
                              {job.state.lastStatus}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-zinc-500 text-xs mb-1">Schedule</p>
                            <p className="font-medium text-zinc-900">{formatSchedule(job.schedule)}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500 text-xs mb-1">Next Run</p>
                            <p className="font-medium text-zinc-900">{formatNextRun(job.state?.nextRunAtMs)}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500 text-xs mb-1">Last Duration</p>
                            <p className="font-medium text-zinc-900">{formatDuration(job.state?.lastDurationMs)}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500 text-xs mb-1">Model</p>
                            <p className="font-medium text-zinc-900">{job.payload.model || 'default'}</p>
                          </div>
                        </div>

                        {job.state && (job.state.consecutiveErrors ?? 0) > 0 && (
                          <div className="mt-3 pt-3 border-t border-zinc-100">
                            <p className="text-xs text-red-600">
                              ⚠️ {job.state.consecutiveErrors} consecutive error{(job.state.consecutiveErrors ?? 0) > 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Disabled Jobs */}
              {disabledJobs.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
                    Deaktivierte Jobs ({disabledJobs.length})
                  </h2>
                  <div className="space-y-2 opacity-60">
                    {disabledJobs.map(job => (
                      <div
                        key={job.id}
                        className="bg-zinc-50 border border-zinc-200 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{agentEmojis[job.agentId] || '🤖'}</span>
                          <div>
                            <h3 className="font-semibold text-zinc-700">{job.name}</h3>
                            <p className="text-xs text-zinc-500">{job.agentId} · {formatSchedule(job.schedule)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {filteredJobs.length === 0 && (
                <div className="text-center py-20 text-zinc-400">
                  <p className="text-4xl mb-3">📅</p>
                  <p className="text-sm">Keine Jobs für diesen Agent.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Link
        href="/help"
        className="fixed bottom-6 right-6 w-11 h-11 bg-zinc-900 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg hover:bg-zinc-700 hover:scale-105 transition-all z-50"
        title="Hilfe"
      >
        ?
      </Link>
    </div>
  );
}
