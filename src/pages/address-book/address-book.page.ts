import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AddressBookService, AddressBookEntry } from '../../app/core/services/address-book.service';
import { ConnectService } from '../../app/core/services/connect.service';

@Component({
  selector: 'app-address-book',
  template: `
    <div class="h-full p-6 overflow-auto animate-fade-in">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">{{ 'Address Book' | translate }}</h1>
        <button
          *ngIf="entries.length > 0"
          (click)="confirmClearAll()"
          class="btn-ghost btn-sm text-red-400 hover:text-red-300">
          {{ 'Clear All' | translate }}
        </button>
      </div>

      <!-- Empty state -->
      <div *ngIf="entries.length === 0" class="card text-center py-12">
        <svg class="w-16 h-16 mx-auto text-dark-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <h3 class="text-lg font-medium text-dark-300 mb-2">{{ 'No saved connections' | translate }}</h3>
        <p class="text-dark-400 text-sm">{{ 'Connected partners will appear here' | translate }}</p>
      </div>

      <!-- Entries list -->
      <div class="space-y-3">
        <div
          *ngFor="let entry of entries"
          class="card flex items-center justify-between group">
          <div class="flex-1 min-w-0">
            <div *ngIf="editingId !== entry.id" class="flex items-center space-x-3">
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ entry.name }}</div>
                <div class="text-sm text-dark-400 font-mono">{{ formatId(entry.id) }}</div>
              </div>
            </div>
            <div *ngIf="editingId === entry.id" class="flex items-center space-x-2">
              <input
                type="text"
                [(ngModel)]="editingName"
                class="input py-1"
                (keydown.enter)="saveEdit(entry)"
                (keydown.escape)="cancelEdit()">
              <button (click)="saveEdit(entry)" class="btn-primary btn-sm">
                {{ 'Save' | translate }}
              </button>
              <button (click)="cancelEdit()" class="btn-ghost btn-sm">
                {{ 'Cancel' | translate }}
              </button>
            </div>
          </div>

          <div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              *ngIf="editingId !== entry.id"
              (click)="startEdit(entry)"
              class="btn-ghost btn-sm"
              title="Rename">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button
              (click)="connect(entry)"
              class="btn-primary btn-sm">
              {{ 'Connect' | translate }}
            </button>
            <button
              (click)="removeEntry(entry)"
              class="btn-ghost btn-sm text-red-400 hover:text-red-300"
              title="Remove">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Clear all confirmation -->
      <div
        *ngIf="showClearConfirm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="card max-w-sm w-full mx-4 animate-slide-in">
          <h3 class="text-lg font-semibold mb-4">{{ 'Clear Address Book' | translate }}</h3>
          <p class="text-dark-300 mb-6">{{ 'Are you sure you want to remove all saved connections?' | translate }}</p>
          <div class="flex space-x-3">
            <button (click)="showClearConfirm = false" class="btn-secondary flex-1">
              {{ 'Cancel' | translate }}
            </button>
            <button (click)="clearAll()" class="btn-danger flex-1">
              {{ 'Clear All' | translate }}
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
export class AddressBookPage implements OnInit, OnDestroy {
  entries: AddressBookEntry[] = [];
  editingId: string | null = null;
  editingName = '';
  showClearConfirm = false;

  private sub: Subscription | null = null;

  constructor(
    private addressBookService: AddressBookService,
    private connectService: ConnectService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.sub = this.addressBookService.getEntries().subscribe(entries => {
      this.entries = entries.sort((a, b) => (b.lastConnected || b.createdAt) - (a.lastConnected || a.createdAt));
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  formatId(id: string): string {
    if (id.length === 9) {
      return `${id.slice(0, 3)} ${id.slice(3, 6)} ${id.slice(6, 9)}`;
    }
    return id;
  }

  startEdit(entry: AddressBookEntry): void {
    this.editingId = entry.id;
    this.editingName = entry.name;
  }

  async saveEdit(entry: AddressBookEntry): Promise<void> {
    if (this.editingName.trim()) {
      await this.addressBookService.renameEntry(entry.id, this.editingName.trim());
    }
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editingName = '';
  }

  async connect(entry: AddressBookEntry): Promise<void> {
    await this.addressBookService.updateLastConnected(entry.id);
    await this.connectService.connect(entry.id);
  }

  async removeEntry(entry: AddressBookEntry): Promise<void> {
    await this.addressBookService.removeEntry(entry.id);
  }

  confirmClearAll(): void {
    this.showClearConfirm = true;
  }

  async clearAll(): Promise<void> {
    await this.addressBookService.clearAll();
    this.showClearConfirm = false;
  }
}
