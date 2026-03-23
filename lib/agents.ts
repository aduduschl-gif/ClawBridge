// Default agents - customize these for your team!
// You can also configure agents in Settings (coming soon)

export const AGENTS: Record<string, { name: string; emoji: string; color: string }> = {
  // Example agents - replace with your own
  agent1: { name: 'Agent 1', emoji: '🤖', color: '#3B82F6' },
  agent2: { name: 'Agent 2', emoji: '🚀', color: '#8B5CF6' },
  agent3: { name: 'Agent 3', emoji: '🧠', color: '#10B981' },
  agent4: { name: 'Agent 4', emoji: '⚡', color: '#F59E0B' },
  // Human users
  human: { name: 'Human', emoji: '👤', color: '#6B7280' },
};

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const STATUSES = ['open', 'in-progress', 'waiting', 'done'] as const;

export const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-50 text-blue-700 border border-blue-200',
  'in-progress': 'bg-amber-50 text-amber-700 border border-amber-200',
  waiting: 'bg-orange-50 text-orange-700 border border-orange-200',
  done: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-50 text-slate-600 border border-slate-200',
  medium: 'bg-blue-50 text-blue-600 border border-blue-200',
  high: 'bg-orange-50 text-orange-600 border border-orange-200',
  urgent: 'bg-red-50 text-red-600 border border-red-200',
};

export const STATUS_ICONS: Record<string, string> = {
  open: '○',
  'in-progress': '◐',
  waiting: '◷',
  done: '●',
};

export const PRIORITY_ICONS: Record<string, string> = {
  low: '↓',
  medium: '→',
  high: '↑',
  urgent: '⚡',
};
