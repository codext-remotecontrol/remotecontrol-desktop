import { MatInputModule } from '@angular/material/input';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RemotePageRoutingModule } from './remote-routing.module';

import { PwDialog, RemotePage } from './remote.page';
import { LottieModule } from 'ngx-lottie';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RemotePageRoutingModule,
    LottieModule,
    MatTooltipModule,
    MatDialogModule,
    MatButtonModule,
    TranslateModule,
    MatInputModule,
  ],
  declarations: [RemotePage, PwDialog],
})
export class RemotePageModule {}
