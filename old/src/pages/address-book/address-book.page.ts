import { Component, OnInit } from '@angular/core';
import { AddressBookService } from '../../app/core/services/address-book.service';
import { ConnectService } from '../../app/core/services/connect.service';

@Component({
    selector: 'app-address-book',
    templateUrl: './address-book.page.html',
    styleUrls: ['./address-book.page.scss'],
})
export class AddressBookPage implements OnInit {
    constructor(
        public addressBookService: AddressBookService,
        private connectService: ConnectService
    ) {}

    async ngOnInit() {
        await this.addressBookService.load();
    }

    connect(id) {
        this.connectService.connect(id);
    }
}
