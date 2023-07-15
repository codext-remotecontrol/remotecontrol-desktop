import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RemotePageRoutingModule } from './remote-routing.module';

import { PwDialog, RemotePage } from './remote.page';
import { LottieModule } from 'ngx-lottie';
import { TranslateModule } from '@ngx-translate/core';
@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RemotePageRoutingModule,
        LottieModule,
        TranslateModule,
    ],
    declarations: [RemotePage, PwDialog],
})
export class RemotePageModule {}
