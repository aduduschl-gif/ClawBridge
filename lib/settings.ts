// Client-side settings helper

export interface Settings {
  databaseUrl: string;
  openclawGatewayUrl: string;
  defaultAgentName: string;
  theme: 'light' | 'dark' | 'system';
}

export const defaultSettings: Settings = {
  databaseUrl: '',
  openclawGatewayUrl: '',
  defaultAgentName: '',
  theme: 'system',
};

// Simple encryption for localStorage
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

export function getSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings;
  
  const stored = localStorage.getItem('clawbridge_settings');
  if (!stored) return defaultSettings;
  
  try {
    const parsed = JSON.parse(stored);
    return {
      ...defaultSettings,
      ...parsed,
      databaseUrl: decrypt(parsed.databaseUrl || ''),
      openclawGatewayUrl: decrypt(parsed.openclawGatewayUrl || ''),
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;
  
  const toStore = {
    ...settings,
    databaseUrl: encrypt(settings.databaseUrl),
    openclawGatewayUrl: encrypt(settings.openclawGatewayUrl),
  };
  localStorage.setItem('clawbridge_settings', JSON.stringify(toStore));
}

export function clearSettings(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('clawbridge_settings');
}

export function isConfigured(): boolean {
  const settings = getSettings();
  return !!settings.databaseUrl;
}
