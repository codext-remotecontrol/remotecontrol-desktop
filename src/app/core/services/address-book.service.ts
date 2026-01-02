import { Injectable } from '@angular/core';
import { Store } from '@tauri-apps/plugin-store';
import { BehaviorSubject } from 'rxjs';

export interface AddressBookEntry {
  id: string;
  name: string;
  lastConnected?: number;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class AddressBookService {
  private store: Store | null = null;
  private entries: AddressBookEntry[] = [];
  private entries$ = new BehaviorSubject<AddressBookEntry[]>([]);

  constructor() {
    this.initStore();
  }

  private async initStore(): Promise<void> {
    try {
      this.store = await Store.load('address-book.json');
      await this.loadEntries();
    } catch (error) {
      console.error('Failed to initialize address book store:', error);
    }
  }

  private async ensureStore(): Promise<Store> {
    if (!this.store) {
      this.store = await Store.load('address-book.json');
    }
    return this.store;
  }

  private async loadEntries(): Promise<void> {
    try {
      const store = await this.ensureStore();
      const saved = await store.get<AddressBookEntry[]>('entries');
      if (saved && Array.isArray(saved)) {
        this.entries = saved;
        this.entries$.next(this.entries);
      }
    } catch (error) {
      console.error('Failed to load address book:', error);
    }
  }

  private async saveEntries(): Promise<void> {
    try {
      const store = await this.ensureStore();
      await store.set('entries', this.entries);
      await store.save();
      this.entries$.next(this.entries);
    } catch (error) {
      console.error('Failed to save address book:', error);
    }
  }

  getEntries() {
    return this.entries$.asObservable();
  }

  async getEntriesList(): Promise<AddressBookEntry[]> {
    return [...this.entries];
  }

  async addEntry(id: string, name: string): Promise<void> {
    // Check if entry already exists
    const existingIndex = this.entries.findIndex(e => e.id === id);

    if (existingIndex >= 0) {
      // Update existing entry
      this.entries[existingIndex].name = name;
      this.entries[existingIndex].lastConnected = Date.now();
    } else {
      // Add new entry
      this.entries.push({
        id,
        name,
        createdAt: Date.now(),
      });
    }

    await this.saveEntries();
  }

  async updateLastConnected(id: string): Promise<void> {
    const entry = this.entries.find(e => e.id === id);
    if (entry) {
      entry.lastConnected = Date.now();
      await this.saveEntries();
    }
  }

  async removeEntry(id: string): Promise<void> {
    this.entries = this.entries.filter(e => e.id !== id);
    await this.saveEntries();
  }

  async renameEntry(id: string, newName: string): Promise<void> {
    const entry = this.entries.find(e => e.id === id);
    if (entry) {
      entry.name = newName;
      await this.saveEntries();
    }
  }

  async clearAll(): Promise<void> {
    this.entries = [];
    await this.saveEntries();
  }

  getEntryById(id: string): AddressBookEntry | undefined {
    return this.entries.find(e => e.id === id);
  }
}
