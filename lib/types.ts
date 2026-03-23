export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  creator_agent: string;
  assigned_agents: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  closed_by_agent: string | null;
  reply_count?: number;
  replies?: Reply[];
}

export interface Reply {
  id: string;
  ticket_id: string;
  agent: string;
  message: string;
  created_at: string;
  updated_at: string | null;
  is_edited: boolean;
}
