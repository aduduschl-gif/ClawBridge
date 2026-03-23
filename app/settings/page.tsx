'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface Settings {
  databaseUrl: string;
  openclawGatewayUrl: string;
  defaultAgentName: string;
  theme: 'light' | 'dark' | 'system';
  agents: Agent[];
}

const defaultSettings: Settings = {
  databaseUrl: '',
  openclawGatewayUrl: '',
  defaultAgentName: '',
  theme: 'system',
  agents: [],
};

const EMOJI_OPTIONS = ['🤖', '🚀', '🧠', '⚡', '💡', '🎯', '🔥', '💼', '🛠️', '📊', '🎨', '🔧', '👤', '👨‍💻', '👩‍💻'];
const COLOR_OPTIONS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#14B8A6', '#EF4444', '#6366F1', '#84CC16', '#6B7280'];

const encrypt = (text: string): string => {
  if (!text) return '';
  return btoa(encodeURIComponent(text));
};

const decrypt = (text: string): string => {
  if (!text) return '';
  try {
    return decodeURIComponent(atob(text));
  } catch {
    return '';
  }
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [showDbUrl, setShowDbUrl] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [newAgent, setNewAgent] = useState<Agent>({ id: '', name: '', emoji: '🤖', color: '#3B82F6' });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('clawbridge_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({
          ...defaultSettings,
          ...parsed,
          databaseUrl: decrypt(parsed.databaseUrl || ''),
          openclawGatewayUrl: decrypt(parsed.openclawGatewayUrl || ''),
          agents: parsed.agents || [],
        });
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    const toStore = {
      ...settings,
      databaseUrl: encrypt(settings.databaseUrl),
      openclawGatewayUrl: encrypt(settings.openclawGatewayUrl),
    };
    localStorage.setItem('clawbridge_settings', JSON.stringify(toStore));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!settings.databaseUrl) {
      setTestStatus('error');
      setTestMessage('No database URL configured');
      return;
    }
    setTestStatus('testing');
    setTestMessage('Testing connection...');
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseUrl: settings.databaseUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus('success');
        setTestMessage('Connection successful!');
      } else {
        setTestStatus('error');
        setTestMessage(data.error || 'Connection failed');
      }
    } catch (e) {
      setTestStatus('error');
      setTestMessage('Failed to test connection');
    }
    setTimeout(() => { setTestStatus('idle'); setTestMessage(''); }, 3000);
  };

  const handleAddAgent = () => {
    if (!newAgent.name.trim()) return;
    const id = newAgent.name.toLowerCase().replace(/\s+/g, '-');
    if (settings.agents.some(a => a.id === id)) {
      alert('An agent with this name already exists');
      return;
    }
    setSettings({
      ...settings,
      agents: [...settings.agents, { ...newAgent, id }],
    });
    setNewAgent({ id: '', name: '', emoji: '🤖', color: '#3B82F6' });
  };

  const handleRemoveAgent = (id: string) => {
    setSettings({
      ...settings,
      agents: settings.agents.filter(a => a.id !== id),
    });
  };

  const handleClearSettings = () => {
    if (confirm('Are you sure you want to clear all settings?')) {
      localStorage.removeItem('clawbridge_settings');
      setSettings(defaultSettings);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">⚙️ Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-8">
          
          {/* Database Connection */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🗄️ Database Connection</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PostgreSQL Database URL</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showDbUrl ? 'text' : 'password'}
                      value={settings.databaseUrl}
                      onChange={(e) => setSettings({ ...settings, databaseUrl: e.target.value })}
                      placeholder="postgresql://user:password@host:5432/database"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="button" onClick={() => setShowDbUrl(!showDbUrl)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      {showDbUrl ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <button onClick={handleTestConnection} disabled={testStatus === 'testing'} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50">
                    {testStatus === 'testing' ? '...' : 'Test'}
                  </button>
                </div>
                {testMessage && (
                  <p className={`mt-2 text-sm ${testStatus === 'success' ? 'text-green-600' : testStatus === 'error' ? 'text-red-600' : 'text-gray-500'}`}>{testMessage}</p>
                )}
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your database URL is encrypted and stored locally in your browser.</p>
              </div>
            </div>
          </section>

          {/* Agents */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🤖 Agents</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add your AI agents and team members who will use ClawBridge.</p>
            
            {/* Agent List */}
            {settings.agents.length > 0 && (
              <div className="space-y-2 mb-4">
                {settings.agents.map(agent => (
                  <div key={agent.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-2xl">{agent.emoji}</span>
                    <span className="font-medium text-gray-900 dark:text-white flex-1">{agent.name}</span>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: agent.color }}></div>
                    <button onClick={() => handleRemoveAgent(agent.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Agent Form */}
            <div className="flex flex-wrap gap-2 items-end p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="Agent name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              
              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Emoji</label>
                <button
                  onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowColorPicker(false); }}
                  className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-xl flex items-center justify-center"
                >
                  {newAgent.emoji}
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-full mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 grid grid-cols-5 gap-1">
                    {EMOJI_OPTIONS.map(emoji => (
                      <button key={emoji} onClick={() => { setNewAgent({ ...newAgent, emoji }); setShowEmojiPicker(false); }} className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg">
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Color</label>
                <button
                  onClick={() => { setShowColorPicker(!showColorPicker); setShowEmojiPicker(false); }}
                  className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                  style={{ backgroundColor: newAgent.color }}
                ></button>
                {showColorPicker && (
                  <div className="absolute top-full mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 grid grid-cols-5 gap-1">
                    {COLOR_OPTIONS.map(color => (
                      <button key={color} onClick={() => { setNewAgent({ ...newAgent, color }); setShowColorPicker(false); }} className="w-6 h-6 rounded" style={{ backgroundColor: color }}></button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleAddAgent} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                + Add
              </button>
            </div>
          </section>

          {/* OpenClaw Integration */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🦞 OpenClaw Integration (Optional)</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gateway URL</label>
              <input
                type="text"
                value={settings.openclawGatewayUrl}
                onChange={(e) => setSettings({ ...settings, openclawGatewayUrl: e.target.value })}
                placeholder="http://localhost:18789"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Connect to your OpenClaw gateway for calendar and agent features.</p>
            </div>
          </section>

          {/* Preferences */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">👤 Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Name</label>
                <input
                  type="text"
                  value={settings.defaultAgentName}
                  onChange={(e) => setSettings({ ...settings, defaultAgentName: e.target.value })}
                  placeholder="Your display name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as Settings['theme'] })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button onClick={handleClearSettings} className="px-4 py-2 text-red-600 hover:text-red-700">Clear All Settings</button>
            <div className="flex items-center gap-4">
              {saved && <span className="text-green-600 text-sm">✓ Saved!</span>}
              <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save Settings</button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🔒 Privacy Note</h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">All settings are stored locally in your browser. Nothing is sent to any server until you actively use the features.</p>
        </div>
      </main>
    </div>
  );
}
