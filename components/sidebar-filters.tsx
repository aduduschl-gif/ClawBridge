'use client';

import { AGENTS, STATUSES, STATUS_ICONS, PRIORITY_ICONS } from '@/lib/agents';

interface Filters {
  status: string;
  creator: string;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  statusCounts: Record<string, number>;
  totalCount: number;
}

export default function SidebarFilters({ filters, onChange, statusCounts, totalCount }: Props) {
  const toggle = (key: keyof Filters, val: string) => {
    onChange({ ...filters, [key]: filters[key] === val ? '' : val });
  };

  const clearAll = () => onChange({ status: '', creator: '' });
  const hasFilters = filters.status || filters.creator;

  return (
    <aside className="w-52 shrink-0 hidden md:block">
      <div className="sticky top-20 space-y-5">
        {/* Active filters summary */}
        {hasFilters && (
          <button onClick={clearAll}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
            ✕ Filter zurücksetzen
          </button>
        )}

        {/* Status */}
        <div>
          <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 px-1">Status</h4>
          <div className="space-y-0.5">
            <button onClick={() => onChange({ ...filters, status: '' })}
              className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all flex items-center justify-between ${
                !filters.status ? 'bg-zinc-900 text-white font-medium' : 'text-zinc-500 hover:bg-zinc-100'
              }`}>
              <span>Alle</span>
              <span className={`text-xs tabular-nums ${!filters.status ? 'text-white/60' : 'text-zinc-400'}`}>{totalCount}</span>
            </button>
            {STATUSES.map(s => (
              <button key={s} onClick={() => toggle('status', s)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all flex items-center justify-between ${
                  filters.status === s ? 'bg-zinc-900 text-white font-medium' : 'text-zinc-600 hover:bg-zinc-100'
                }`}>
                <span className="flex items-center gap-2">
                  <span className="w-4 text-center text-xs">{STATUS_ICONS[s]}</span>
                  <span className="capitalize">{s}</span>
                </span>
                <span className={`text-xs tabular-nums ${filters.status === s ? 'text-white/60' : 'text-zinc-400'}`}>
                  {statusCounts[s] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Creator */}
        <div>
          <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 px-1">Erstellt von</h4>
          <div className="space-y-0.5">
            <button onClick={() => onChange({ ...filters, creator: '' })}
              className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                !filters.creator ? 'bg-zinc-900 text-white font-medium' : 'text-zinc-500 hover:bg-zinc-100'
              }`}>
              Alle
            </button>
            {Object.entries(AGENTS).filter(([k]) => !['andi','jonas','martin'].includes(k)).map(([key, a]) => (
              <button key={key} onClick={() => toggle('creator', key)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                  filters.creator === key ? 'bg-zinc-900 text-white font-medium' : 'text-zinc-600 hover:bg-zinc-100'
                }`}>
                <span className="flex items-center gap-2">
                  <span className="w-5 text-center">{a.emoji}</span>
                  <span>{a.name}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
