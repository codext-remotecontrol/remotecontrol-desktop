import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ConnectService, ConnectionState } from '../../app/core/services/connect.service';
import { TauriService, ScreenInfo } from '../../app/core/services/tauri.service';
import { AddressBookService } from '../../app/core/services/address-book.service';

@Component({
  selector: 'app-home',
  template: `
    <div class="h-full flex flex-col p-6 animate-fade-in">
      <!-- Connection ID Section -->
      <div class="card mb-6">
        <h2 class="text-lg font-semibold mb-4">{{ 'Your ID' | translate }}</h2>

        <!-- ID Display -->
        <div class="flex justify-center mb-4">
          <div class="flex space-x-1">
            <ng-container *ngFor="let digit of connectService.idArray; let i = index">
              <div
                class="w-10 h-12 flex items-center justify-center bg-dark-700 rounded-lg text-xl font-mono font-bold"
                [class.mr-2]="i === 2 || i === 5">
                {{ digit }}
              </div>
            </ng-container>
          </div>
        </div>

        <!-- Connection Status -->
        <div class="flex items-center justify-center space-x-2 text-sm">
          <span
            class="w-2 h-2 rounded-full"
            [class.bg-green-500]="connectionState.status === 'connected'"
            [class.bg-yellow-500]="connectionState.status === 'connecting'"
            [class.bg-gray-500]="connectionState.status === 'disconnected'"
            [class.bg-red-500]="connectionState.status === 'error'">
          </span>
          <span class="text-dark-400">
            {{ getStatusText() }}
          </span>
        </div>
      </div>

      <!-- Screen Selection -->
      <div class="card mb-6" *ngIf="screens.length > 0">
        <h2 class="text-lg font-semibold mb-4">{{ 'Screen' | translate }}</h2>
        <div class="grid grid-cols-2 gap-3">
          <button
            *ngFor="let screen of screens"
            (click)="selectScreen(screen)"
            class="p-3 rounded-lg border-2 transition-all text-left hover:border-dark-500"
            [ngClass]="selectedScreen?.id === screen.id ? 'border-primary-500 bg-primary-500/10' : 'border-dark-600'">
            <div class="text-sm font-medium truncate">{{ screen.name }}</div>
            <div class="text-xs text-dark-400">{{ screen.width }}x{{ screen.height }}</div>
          </button>
        </div>
      </div>

      <!-- Connect to Partner Section -->
      <div class="card flex-1">
        <h2 class="text-lg font-semibold mb-4">{{ 'Connect to Partner' | translate }}</h2>

        <!-- Partner ID Input -->
        <div class="flex justify-center mb-4">
          <div class="flex space-x-1">
            <ng-container *ngFor="let slot of connectService.remoteIdArray; let i = index">
              <input
                type="text"
                maxlength="1"
                class="w-10 h-12 text-center bg-dark-700 border border-dark-600 rounded-lg text-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                [class.mr-2]="i === 2 || i === 5"
                [value]="slot.number ?? ''"
                (input)="onDigitInput($event, i)"
                (keydown)="onDigitKeydown($event, i)"
                (paste)="onPaste($event)"
                #digitInput>
            </ng-container>
          </div>
        </div>

        <!-- Connect Button -->
        <button
          (click)="connect()"
          [disabled]="!canConnect()"
          class="btn-primary w-full py-3 text-lg">
          {{ 'Connect' | translate }}
        </button>
      </div>

      <!-- Permission Dialog -->
      <div
        *ngIf="showPermissionDialog"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="card max-w-sm w-full mx-4 animate-slide-in">
          <h3 class="text-lg font-semibold mb-4">{{ 'New connection' | translate }}</h3>
          <p class="text-dark-300 mb-6">{{ 'Do you want to accept the connection?' | translate }}</p>
          <div class="flex space-x-3">
            <button (click)="declineConnection()" class="btn-secondary flex-1">
              {{ 'Decline' | translate }}
            </button>
            <button (click)="acceptConnection()" class="btn-primary flex-1">
              {{ 'Accept' | translate }}
            </button>
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
export class HomePage implements OnInit, OnDestroy {
  screens: ScreenInfo[] = [];
  selectedScreen: ScreenInfo | null = null;
  connectionState: ConnectionState = { status: 'disconnected' };
  showPermissionDialog = false;
  private permissionResolver: ((value: boolean) => void) | null = null;

  private subs: Subscription[] = [];

  constructor(
    public connectService: ConnectService,
    private tauriService: TauriService,
    private addressBookService: AddressBookService,
    private translate: TranslateService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    // Load available screens
    await this.loadScreens();

    // Subscribe to connection state
    this.subs.push(
      this.connectService.getConnectionState().subscribe(state => {
        this.connectionState = state;
      })
    );

    // Subscribe to permission requests
    this.subs.push(
      this.connectService.getPermissionRequest().subscribe(request => {
        this.showPermissionDialog = true;
        this.permissionResolver = request.resolve;
      })
    );

    // Initialize connection
    await this.connectService.init();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private async loadScreens(): Promise<void> {
    try {
      this.screens = await this.tauriService.getScreens();
      // Select primary screen by default
      this.selectedScreen = this.screens.find(s => s.is_primary) || this.screens[0];
      if (this.selectedScreen) {
        this.connectService.setSelectedScreen(this.selectedScreen);
      }
    } catch (error) {
      console.error('Failed to load screens:', error);
    }
  }

  selectScreen(screen: ScreenInfo): void {
    this.selectedScreen = screen;
    this.connectService.setSelectedScreen(screen);
  }

  getStatusText(): string {
    switch (this.connectionState.status) {
      case 'connected':
        return this.translate.instant('Connected');
      case 'connecting':
        return this.translate.instant('Connecting...');
      case 'error':
        return this.connectionState.message || this.translate.instant('Error');
      default:
        return this.translate.instant('Ready');
    }
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    if (value.length === 1) {
      this.connectService.remoteIdArray[index] = { number: parseInt(value, 10) };

      // Move to next input
      if (index < 8) {
        const inputs = document.querySelectorAll('input[type="text"]');
        (inputs[index + 1] as HTMLInputElement)?.focus();
      }
    } else {
      input.value = '';
      this.connectService.remoteIdArray[index] = {};
    }
  }

  onDigitKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !(event.target as HTMLInputElement).value && index > 0) {
      const inputs = document.querySelectorAll('input[type="text"]');
      (inputs[index - 1] as HTMLInputElement)?.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text') || '';
    const digits = paste.replace(/\D/g, '').slice(0, 9);

    digits.split('').forEach((digit, i) => {
      this.connectService.remoteIdArray[i] = { number: parseInt(digit, 10) };
    });

    // Update inputs
    const inputs = document.querySelectorAll('input[type="text"]');
    inputs.forEach((input, i) => {
      (input as HTMLInputElement).value = this.connectService.remoteIdArray[i]?.number?.toString() || '';
    });
  }

  canConnect(): boolean {
    return this.connectService.remoteIdArray.every(slot => slot.number !== undefined);
  }

  async connect(): Promise<void> {
    if (!this.canConnect()) return;

    const partnerId = this.connectService.remoteIdArray
      .map(slot => slot.number)
      .join('');

    // Add to address book
    await this.addressBookService.addEntry(partnerId, `Partner ${partnerId}`);

    // Open remote window
    await this.connectService.connect(partnerId);
  }

  acceptConnection(): void {
    this.showPermissionDialog = false;
    this.permissionResolver?.(true);
    this.permissionResolver = null;
  }

  declineConnection(): void {
    this.showPermissionDialog = false;
    this.permissionResolver?.(false);
    this.permissionResolver = null;
  }
}
