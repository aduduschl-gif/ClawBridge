// Agents can be configured in Settings
// This file provides defaults and helper functions

export interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

// Default agent (for when no agents are configured)
const DEFAULT_AGENTS: Record<string, AgentConfig> = {
  human: { id: 'human', name: 'Human', emoji: '👤', color: '#6B7280' },
};

// Get agents from localStorage or return defaults
export function getAgents(): Record<string, AgentConfig> {
  if (typeof window === 'undefined') return DEFAULT_AGENTS;
  
  try {
    const stored = localStorage.getItem('clawbridge_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.agents && parsed.agents.length > 0) {
        const agents: Record<string, AgentConfig> = { ...DEFAULT_AGENTS };
        parsed.agents.forEach((a: AgentConfig) => {
          agents[a.id] = a;
        });
        return agents;
      }
    }
  } catch (e) {
    console.error('Failed to load agents:', e);
  }
  
  return DEFAULT_AGENTS;
}

// For backwards compatibility
export const AGENTS = DEFAULT_AGENTS;

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
