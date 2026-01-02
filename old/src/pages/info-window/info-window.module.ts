import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InfoWindowPageRoutingModule } from './info-window-routing.module';

import { InfoWindowPage } from './info-window.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        InfoWindowPageRoutingModule,
    ],
    declarations: [InfoWindowPage],
})
export class InfoWindowPageModule {}
