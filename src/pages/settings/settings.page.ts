import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService, AppSettings } from '../../app/core/services/settings.service';
import { TauriService } from '../../app/core/services/tauri.service';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

@Component({
  selector: 'app-settings',
  template: `
    <div class="h-full p-6 overflow-auto animate-fade-in">
      <h1 class="text-2xl font-bold mb-6">{{ 'Settings' | translate }}</h1>

      <!-- Language -->
      <div class="card mb-4">
        <h2 class="text-lg font-semibold mb-4">{{ 'Language' | translate }}</h2>
        <div class="flex space-x-3">
          <button
            (click)="setLanguage('en')"
            class="flex-1 p-3 rounded-lg border-2 transition-all text-center"
            [ngClass]="settings.language === 'en' ? 'border-primary-500 bg-primary-500/10' : 'border-dark-600'">
            <div class="text-xl mb-1">EN</div>
            <div class="text-sm">English</div>
          </button>
          <button
            (click)="setLanguage('de')"
            class="flex-1 p-3 rounded-lg border-2 transition-all text-center"
            [ngClass]="settings.language === 'de' ? 'border-primary-500 bg-primary-500/10' : 'border-dark-600'">
            <div class="text-xl mb-1">DE</div>
            <div class="text-sm">Deutsch</div>
          </button>
        </div>
      </div>

      <!-- Connection ID -->
      <div class="card mb-4">
        <h2 class="text-lg font-semibold mb-4">{{ 'Connection ID' | translate }}</h2>
        <label class="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            [checked]="settings.randomId"
            (change)="toggleRandomId()"
            class="w-5 h-5 rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-primary-500">
          <span>{{ 'Generate random ID on each start' | translate }}</span>
        </label>
        <p class="text-sm text-dark-400 mt-2">
          {{ 'When disabled, your ID will be based on your machine and stay the same.' | translate }}
        </p>
      </div>

      <!-- Hidden Access -->
      <div class="card mb-4">
        <h2 class="text-lg font-semibold mb-4">{{ 'Unattended Access' | translate }}</h2>
        <label class="flex items-center space-x-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            [checked]="settings.hiddenAccess"
            (change)="toggleHiddenAccess()"
            class="w-5 h-5 rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-primary-500">
          <span>{{ 'Enable unattended access' | translate }}</span>
        </label>

        <div *ngIf="settings.hiddenAccess">
          <div *ngIf="settings.passwordHash" class="flex items-center justify-between p-3 bg-dark-700 rounded-lg mb-3">
            <span class="text-green-400">{{ 'Password is set' | translate }}</span>
            <button (click)="showPasswordSetup = true" class="btn-secondary btn-sm">
              {{ 'Change' | translate }}
            </button>
          </div>

          <div *ngIf="!settings.passwordHash || showPasswordSetup">
            <input
              type="password"
              [(ngModel)]="newPassword"
              class="input mb-2"
              [placeholder]="'New password' | translate">
            <input
              type="password"
              [(ngModel)]="confirmPassword"
              class="input mb-3"
              [placeholder]="'Confirm password' | translate">

            <div *ngIf="passwordError" class="text-red-400 text-sm mb-3">
              {{ passwordError }}
            </div>

            <div class="text-xs text-dark-400 mb-3">
              {{ 'Password must contain at least 8 characters, uppercase, lowercase, number, and special character.' | translate }}
            </div>

            <button
              (click)="setPassword()"
              [disabled]="!newPassword || !confirmPassword"
              class="btn-primary w-full">
              {{ 'Set Password' | translate }}
            </button>
          </div>
        </div>

        <p class="text-sm text-dark-400 mt-2">
          {{ 'When enabled, connections require a password instead of manual approval.' | translate }}
        </p>
      </div>

      <!-- Auto Launch -->
      <div class="card mb-4">
        <h2 class="text-lg font-semibold mb-4">{{ 'Startup' | translate }}</h2>
        <label class="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            [checked]="settings.autoLaunch"
            (change)="toggleAutoLaunch()"
            class="w-5 h-5 rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-primary-500">
          <span>{{ 'Start automatically with system' | translate }}</span>
        </label>
      </div>

      <!-- About -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">{{ 'About' | translate }}</h2>
        <div class="space-y-2 text-sm text-dark-300">
          <div class="flex justify-between">
            <span>{{ 'Version' | translate }}</span>
            <span>2.0.0</span>
          </div>
          <div class="flex justify-between">
            <span>{{ 'Built with' | translate }}</span>
            <span>Tauri + Angular</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class SettingsPage implements OnInit {
  settings: AppSettings = {
    language: 'en',
    randomId: true,
    hiddenAccess: false,
    passwordHash: null,
    autoLaunch: false,
    selectedScreenId: null,
  };

  showPasswordSetup = false;
  newPassword = '';
  confirmPassword = '';
  passwordError = '';

  constructor(
    private settingsService: SettingsService,
    private tauriService: TauriService,
    private translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    this.settings = await this.settingsService.getSettings();
  }

  async setLanguage(lang: string): Promise<void> {
    await this.settingsService.setLanguage(lang);
    this.settings.language = lang;
    this.translate.use(lang);
  }

  async toggleRandomId(): Promise<void> {
    this.settings.randomId = !this.settings.randomId;
    await this.settingsService.setRandomId(this.settings.randomId);
  }

  async toggleHiddenAccess(): Promise<void> {
    this.settings.hiddenAccess = !this.settings.hiddenAccess;
    await this.settingsService.setHiddenAccess(this.settings.hiddenAccess);

    if (this.settings.hiddenAccess && !this.settings.passwordHash) {
      this.showPasswordSetup = true;
    }
  }

  async toggleAutoLaunch(): Promise<void> {
    try {
      if (this.settings.autoLaunch) {
        await disable();
      } else {
        await enable();
      }
      this.settings.autoLaunch = !this.settings.autoLaunch;
      await this.settingsService.setAutoLaunch(this.settings.autoLaunch);
    } catch (error) {
      console.error('Failed to toggle auto-launch:', error);
    }
  }

  async setPassword(): Promise<void> {
    this.passwordError = '';

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = this.translate.instant('Passwords do not match');
      return;
    }

    if (!this.validatePassword(this.newPassword)) {
      this.passwordError = this.translate.instant('Password does not meet requirements');
      return;
    }

    try {
      const hash = await this.tauriService.hashPassword(this.newPassword);
      await this.settingsService.setPasswordHash(hash);
      this.settings.passwordHash = hash;
      this.showPasswordSetup = false;
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (error) {
      this.passwordError = this.translate.instant('Failed to set password');
    }
  }

  private validatePassword(password: string): boolean {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    return true;
  }
}
