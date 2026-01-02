import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddressBookPageRoutingModule } from './address-book-routing.module';

import { AddressBookPage } from './address-book.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        AddressBookPageRoutingModule,
        TranslateModule
    ],
    declarations: [AddressBookPage],
})
export class AddressBookPageModule {}
