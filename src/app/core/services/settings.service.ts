import { TranslateService } from '@ngx-translate/core';
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

  constructor(
    private electronService: ElectronService,
    private translate: TranslateService
  ) {}

  async load() {
    const settings: any = {}; // await this.electronService.settings.get('settings');
    console.log(settings);
    if (settings?.language) {
      this.language = settings.language;
      this.translate.setDefaultLang(settings?.language.code);
    } else {
      this.translate.setDefaultLang('de');
    }
    Object.assign(this.settings, settings);
  }

  saveSettings(settings) {
    Object.assign(this.settings, settings);
    // TODO Settings Capacitor
    // await this.electronService.settings.set('settings', this.settings);
  }
}
