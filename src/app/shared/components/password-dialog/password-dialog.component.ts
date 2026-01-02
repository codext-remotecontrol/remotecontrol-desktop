import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-password-dialog',
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="card max-w-sm w-full mx-4 animate-slide-in">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold">{{ 'Password Required' | translate }}</h3>
            <p class="text-sm text-dark-400">{{ 'Enter the password to connect' | translate }}</p>
          </div>
        </div>

        <div *ngIf="error" class="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
          {{ error }}
        </div>

        <input
          type="password"
          [(ngModel)]="password"
          class="input mb-4"
          [placeholder]="'Password' | translate"
          (keydown.enter)="submit()">

        <div class="flex space-x-3">
          <button (click)="cancel.emit()" class="btn-secondary flex-1">
            {{ 'Cancel' | translate }}
          </button>
          <button
            (click)="submit()"
            [disabled]="!password"
            class="btn-primary flex-1">
            {{ 'Submit' | translate }}
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
export class PasswordDialogComponent {
  @Input() error = '';
  @Output() submitted = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  password = '';

  submit(): void {
    if (this.password) {
      this.submitted.emit(this.password);
    }
  }
}
