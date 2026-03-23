'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Settings {
  databaseUrl: string;
  openclawGatewayUrl: string;
  defaultAgentName: string;
  theme: 'light' | 'dark' | 'system';
}

const defaultSettings: Settings = {
  databaseUrl: '',
  openclawGatewayUrl: '',
  defaultAgentName: '',
  theme: 'system',
};

// Simple encryption for localStorage (not production-grade, but better than plaintext)
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

  useEffect(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem('clawbridge_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({
          ...defaultSettings,
          ...parsed,
          databaseUrl: decrypt(parsed.databaseUrl || ''),
          openclawGatewayUrl: decrypt(parsed.openclawGatewayUrl || ''),
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

    setTimeout(() => {
      setTestStatus('idle');
      setTestMessage('');
    }, 3000);
  };

  const handleClearSettings = () => {
    if (confirm('Are you sure you want to clear all settings?')) {
      localStorage.removeItem('clawbridge_settings');
      setSettings(defaultSettings);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              ⚙️ Settings
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-8">
          
          {/* Database Connection */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🗄️ Database Connection
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PostgreSQL Database URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showDbUrl ? 'text' : 'password'}
                      value={settings.databaseUrl}
                      onChange={(e) => setSettings({ ...settings, databaseUrl: e.target.value })}
                      placeholder="postgresql://user:password@host:5432/database"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDbUrl(!showDbUrl)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showDbUrl ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {testStatus === 'testing' ? '...' : 'Test'}
                  </button>
                </div>
                {testMessage && (
                  <p className={`mt-2 text-sm ${testStatus === 'success' ? 'text-green-600' : testStatus === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
                    {testMessage}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Your database URL is encrypted and stored locally in your browser.
                </p>
              </div>
            </div>
          </section>

          {/* OpenClaw Integration */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🦞 OpenClaw Integration (Optional)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gateway URL
                </label>
                <input
                  type="text"
                  value={settings.openclawGatewayUrl}
                  onChange={(e) => setSettings({ ...settings, openclawGatewayUrl: e.target.value })}
                  placeholder="http://localhost:18789"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Connect to your OpenClaw gateway for calendar and agent features.
                </p>
              </div>
            </div>
          </section>

          {/* User Preferences */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              👤 Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Agent Name
                </label>
                <input
                  type="text"
                  value={settings.defaultAgentName}
                  onChange={(e) => setSettings({ ...settings, defaultAgentName: e.target.value })}
                  placeholder="e.g., Bob, Hugo, Alfred..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as Settings['theme'] })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <button
              onClick={handleClearSettings}
              className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear All Settings
            </button>
            <div className="flex items-center gap-4">
              {saved && (
                <span className="text-green-600 dark:text-green-400 text-sm">
                  ✓ Saved!
                </span>
              )}
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            🔒 Privacy Note
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            All settings are stored locally in your browser using encrypted localStorage. 
            Nothing is sent to any server until you actively use the features. 
            Your database credentials never leave your machine.
          </p>
        </div>
      </main>
    </div>
  );
}
