import { Injectable } from '@angular/core';
import { Store } from '@tauri-apps/plugin-store';
import { BehaviorSubject } from 'rxjs';

export interface AppSettings {
  language: string;
  randomId: boolean;
  hiddenAccess: boolean;
  passwordHash: string | null;
  autoLaunch: boolean;
  selectedScreenId: number | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  randomId: true,
  hiddenAccess: false,
  passwordHash: null,
  autoLaunch: false,
  selectedScreenId: null,
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private store: Store | null = null;
  private settings: AppSettings = { ...DEFAULT_SETTINGS };
  private settings$ = new BehaviorSubject<AppSettings>(this.settings);
  private initialized = false;

  constructor() {
    this.initStore();
  }

  private async initStore(): Promise<void> {
    if (this.initialized) return;

    try {
      this.store = await Store.load('settings.json');
      await this.loadSettings();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize settings store:', error);
    }
  }

  private async ensureStore(): Promise<Store> {
    if (!this.store) {
      this.store = await Store.load('settings.json');
    }
    return this.store;
  }

  private async loadSettings(): Promise<void> {
    try {
      const store = await this.ensureStore();

      const savedSettings = await store.get<AppSettings>('settings');
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...savedSettings };
      }

      this.settings$.next(this.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async getSettings(): Promise<AppSettings> {
    await this.initStore();
    return { ...this.settings };
  }

  getSettingsObservable() {
    return this.settings$.asObservable();
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    try {
      const store = await this.ensureStore();

      this.settings = { ...this.settings, ...updates };
      await store.set('settings', this.settings);
      await store.save();

      this.settings$.next(this.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  async setLanguage(language: string): Promise<void> {
    await this.updateSettings({ language });
  }

  async setRandomId(randomId: boolean): Promise<void> {
    await this.updateSettings({ randomId });
  }

  async setHiddenAccess(hiddenAccess: boolean): Promise<void> {
    await this.updateSettings({ hiddenAccess });
  }

  async setPasswordHash(passwordHash: string | null): Promise<void> {
    await this.updateSettings({ passwordHash });
  }

  async setAutoLaunch(autoLaunch: boolean): Promise<void> {
    await this.updateSettings({ autoLaunch });
  }

  async setSelectedScreenId(screenId: number | null): Promise<void> {
    await this.updateSettings({ selectedScreenId: screenId });
  }

  async resetSettings(): Promise<void> {
    await this.updateSettings({ ...DEFAULT_SETTINGS });
  }
}
