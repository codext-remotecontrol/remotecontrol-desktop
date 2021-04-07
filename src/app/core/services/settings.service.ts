import { ElectronService } from './electron/electron.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settings = {
    hiddenAccess: false,
    randomId: false,
    passwordHash: '',
  };

  language: { text: string; code: string } = {
    text: 'Deutsch',
    code: 'de',
  };

  constructor(private electronService: ElectronService) {}

  async load() {
    const settings: any = await this.electronService.settings.get('settings');
    console.log(settings);
    if (settings?.language) {
      this.language = settings.language;
    }
    Object.assign(this.settings, settings);
  }

  async saveSettings(settings) {
    Object.assign(this.settings, settings);
    await this.electronService.settings.set('settings', this.settings);
  }
}
