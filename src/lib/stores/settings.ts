import { writable, get } from 'svelte/store';

export interface Settings {
  connectionId: string;
  password: string;
  passwordHash: string;
  autoStart: boolean;
  minimizeToTray: boolean;
  quality: number;
  fps: number;
}

const defaultSettings: Settings = {
  connectionId: '',
  password: '',
  passwordHash: '',
  autoStart: false,
  minimizeToTray: true,
  quality: 75,
  fps: 30
};

const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;
const STORAGE_KEY = 'remotecontrol-settings';

function createSettingsStore() {
  const { subscribe, set, update } = writable<Settings>(defaultSettings);

  return {
    subscribe,
    set,
    update,
    load: async () => {
      try {
        if (isTauri) {
          const { Store } = await import('@tauri-apps/plugin-store');
          const store = await Store.load('settings.json');
          const saved = await store.get<Settings>('settings');
          if (saved) {
            set({ ...defaultSettings, ...saved });
          }
        } else {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            set({ ...defaultSettings, ...JSON.parse(saved) });
          }
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    },
    save: async () => {
      try {
        const currentSettings = get(settings);
        if (isTauri) {
          const { Store } = await import('@tauri-apps/plugin-store');
          const store = await Store.load('settings.json');
          await store.set('settings', currentSettings);
          await store.save();
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
        }
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    },
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => {
      update(s => ({ ...s, [key]: value }));
    }
  };
}

export const settings = createSettingsStore();
