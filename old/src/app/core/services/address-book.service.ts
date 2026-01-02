import { Injectable } from '@angular/core';
import { get, set } from './storage.service';

@Injectable({
    providedIn: 'root',
})
export class AddressBookService {
    addressBook: any[] = [];

    constructor() {}

    async load() {
        const addressBook = await get('addressBook');
        if (addressBook) {
            this.addressBook = addressBook;
        }
    }

    async save() {
        await set('addressBook', this.addressBook);
    }

    async add(adItem) {
        if (this.addressBook?.find(item => adItem.id == item.id)) {
            return;
        }
        if (!this.addressBook) {
            this.addressBook = [];
        }
        this.addressBook.push(adItem);
        await this.save();
    }

    async remove(adItem) {
        this.addressBook = this.addressBook?.filter(
            _adItem => _adItem.id != adItem.id
        );
        await this.save();
    }
}
