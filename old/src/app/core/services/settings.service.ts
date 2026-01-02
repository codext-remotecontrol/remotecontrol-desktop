import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { get, set } from './storage.service';

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
        private translate: TranslateService
    ) {}

    async load() {
        const settings: any = await get('settings');
        if (settings?.language) {
            this.language = settings.language;
            this.translate.setDefaultLang(settings?.language.code);
        } else {
            this.translate.setDefaultLang('en');
        }
        Object.assign(this.settings, settings);
    }

    async saveSettings(settings) {
        Object.assign(this.settings, settings);
        await set('settings', this.settings);
    }
}
