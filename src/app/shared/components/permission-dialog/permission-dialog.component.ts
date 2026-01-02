import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-permission-dialog',
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="card max-w-sm w-full mx-4 animate-slide-in">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold">{{ 'Incoming Connection' | translate }}</h3>
            <p class="text-sm text-dark-400">{{ 'Someone wants to connect to your computer' | translate }}</p>
          </div>
        </div>

        <p class="text-dark-300 mb-6">
          {{ 'Do you want to allow this connection? The remote user will be able to see and control your screen.' | translate }}
        </p>

        <div class="flex space-x-3">
          <button (click)="decline.emit()" class="btn-secondary flex-1">
            {{ 'Decline' | translate }}
          </button>
          <button (click)="accept.emit()" class="btn-primary flex-1">
            {{ 'Accept' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PermissionDialogComponent {
  @Output() accept = new EventEmitter<void>();
  @Output() decline = new EventEmitter<void>();
}
