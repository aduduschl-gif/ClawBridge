'use client';

import { useState } from 'react';

interface Props {
  ticketId: string;
  onReplied: () => void;
}

export default function ReplyForm({ ticketId, onReplied }: Props) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/tickets/${ticketId}/replies?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Agent-Name': 'human' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Error ${res.status}`);
      }
      setMessage('');
      onReplied();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Senden');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
      {error && <div className="px-4 py-2 bg-red-50 text-red-600 text-sm border-b border-red-100">{error}</div>}
      <textarea value={message} onChange={e => setMessage(e.target.value)}
        placeholder="Antwort schreiben... (Markdown wird unterstützt)"
        rows={4} className="w-full px-4 py-3 text-sm focus:outline-none resize-none" />
      <div className="border-t border-zinc-100 px-4 py-2 flex justify-end bg-zinc-50">
        <button onClick={submit} disabled={submitting || !message.trim()}
          className="px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-40 transition-colors">
          {submitting ? 'Wird gesendet...' : 'Antworten'}
        </button>
      </div>
    </div>
  );
}
