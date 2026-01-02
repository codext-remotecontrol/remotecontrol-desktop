import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from './core/services/settings.service';
import { TauriService } from './core/services/tauri.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container h-screen flex flex-col bg-dark-900">
      <!-- Navigation sidebar for main window -->
      <nav *ngIf="showNav" class="flex-shrink-0 bg-dark-800 border-b border-dark-700">
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center space-x-2">
            <img src="assets/icons/favicon.png" alt="Logo" class="w-8 h-8" *ngIf="logoExists">
            <span class="font-semibold text-lg">Remotecontrol</span>
          </div>
          <div class="flex items-center space-x-2">
            <button
              (click)="navigate('/home')"
              [class.text-primary-400]="isActive('/home')"
              class="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              title="Home">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
            </button>
            <button
              (click)="navigate('/address-book')"
              [class.text-primary-400]="isActive('/address-book')"
              class="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              title="Address Book">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
              </svg>
            </button>
            <button
              (click)="navigate('/settings')"
              [class.text-primary-400]="isActive('/settings')"
              class="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              title="Settings">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <!-- Main content -->
      <main class="flex-1 overflow-auto">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  showNav = true;
  logoExists = false;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private settingsService: SettingsService,
    private tauriService: TauriService
  ) {
    // Set up translations
    this.translate.addLangs(['en', 'de']);
    this.translate.setDefaultLang('en');
  }

  async ngOnInit(): Promise<void> {
    // Load settings and set language
    const settings = await this.settingsService.getSettings();
    this.translate.use(settings.language || 'en');

    // Check logo existence
    this.checkLogoExists();

    // Determine if navigation should be shown
    this.updateNavVisibility();
    this.router.events.subscribe(() => {
      this.updateNavVisibility();
    });
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  private checkLogoExists(): void {
    const img = new Image();
    img.onload = () => { this.logoExists = true; };
    img.onerror = () => { this.logoExists = false; };
    img.src = 'assets/icons/favicon.png';
  }

  private updateNavVisibility(): void {
    const url = this.router.url;
    // Hide nav for remote view and info window
    this.showNav = !url.includes('/remote') && !url.includes('/info');
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }
}
