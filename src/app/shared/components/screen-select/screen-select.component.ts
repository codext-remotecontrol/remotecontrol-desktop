import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { TauriService, ScreenInfo } from '../../../core/services/tauri.service';

@Component({
  selector: 'app-screen-select',
  template: `
    <div class="screen-select">
      <h3 class="text-lg font-semibold mb-4">{{ 'Select Screen to Share' | translate }}</h3>

      <div *ngIf="loading" class="flex items-center justify-center py-8">
        <div class="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div *ngIf="!loading" class="grid grid-cols-2 gap-4">
        <button
          *ngFor="let screen of screens"
          (click)="selectScreen(screen)"
          class="relative p-2 rounded-lg border-2 transition-all overflow-hidden hover:border-dark-500"
          [ngClass]="selectedScreen?.id === screen.id ? 'border-primary-500 bg-primary-500/10' : 'border-dark-600'">

          <!-- Thumbnail -->
          <div class="aspect-video bg-dark-800 rounded overflow-hidden mb-2">
            <img
              *ngIf="thumbnails[screen.id]"
              [src]="'data:image/jpeg;base64,' + thumbnails[screen.id]"
              class="w-full h-full object-cover"
              alt="Screen preview">
            <div
              *ngIf="!thumbnails[screen.id]"
              class="w-full h-full flex items-center justify-center">
              <svg class="w-8 h-8 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>

          <!-- Info -->
          <div class="text-left">
            <div class="text-sm font-medium truncate">{{ screen.name }}</div>
            <div class="text-xs text-dark-400">{{ screen.width }}x{{ screen.height }}</div>
            <div *ngIf="screen.is_primary" class="badge-success text-xs mt-1">Primary</div>
          </div>
        </button>
      </div>

      <div class="flex justify-end space-x-3 mt-6">
        <button (click)="cancel()" class="btn-secondary">
          {{ 'Cancel' | translate }}
        </button>
        <button
          (click)="confirm()"
          [disabled]="!selectedScreen"
          class="btn-primary">
          {{ 'Select' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ScreenSelectComponent implements OnInit {
  @Input() selectedScreen: ScreenInfo | null = null;
  @Output() screenSelected = new EventEmitter<ScreenInfo>();
  @Output() cancelled = new EventEmitter<void>();

  screens: ScreenInfo[] = [];
  thumbnails: Record<number, string> = {};
  loading = true;

  constructor(private tauriService: TauriService) {}

  async ngOnInit(): Promise<void> {
    await this.loadScreens();
  }

  private async loadScreens(): Promise<void> {
    this.loading = true;
    try {
      this.screens = await this.tauriService.getScreens();

      // Select primary screen by default if none selected
      if (!this.selectedScreen) {
        this.selectedScreen = this.screens.find(s => s.is_primary) || this.screens[0];
      }

      // Load thumbnails
      for (const screen of this.screens) {
        try {
          this.thumbnails[screen.id] = await this.tauriService.captureScreenThumbnail(screen.id, 320);
        } catch (error) {
          console.error('Failed to capture thumbnail for screen', screen.id, error);
        }
      }
    } catch (error) {
      console.error('Failed to load screens:', error);
    } finally {
      this.loading = false;
    }
  }

  selectScreen(screen: ScreenInfo): void {
    this.selectedScreen = screen;
  }

  confirm(): void {
    if (this.selectedScreen) {
      this.screenSelected.emit(this.selectedScreen);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
