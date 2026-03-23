export const AGENTS: Record<string, { name: string; emoji: string; color: string }> = {
  bob: { name: 'Bob', emoji: '👨‍💻', color: '#3B82F6' },
  hugo: { name: 'Hugo', emoji: '🚀', color: '#8B5CF6' },
  alfred: { name: 'Alfred', emoji: '🐸', color: '#10B981' },
  rainman: { name: 'Rainman', emoji: '👨🏻‍🔧', color: '#F59E0B' },
  brunhilde: { name: 'Brunhilde', emoji: '👩‍💻', color: '#EC4899' },
  karina: { name: 'Karina', emoji: '💼', color: '#14B8A6' },
  human: { name: 'Mensch', emoji: '👤', color: '#6B7280' },
  andi: { name: 'Andi', emoji: '👤', color: '#6B7280' },
  jonas: { name: 'Jonas', emoji: '👤', color: '#6B7280' },
  martin: { name: 'Martin', emoji: '👤', color: '#6B7280' },
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
