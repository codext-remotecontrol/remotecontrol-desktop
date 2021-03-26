import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RemotePageRoutingModule } from './remote-routing.module';

import { RemotePage } from './remote.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RemotePageRoutingModule
  ],
  declarations: [RemotePage]
})
export class RemotePageModule {}
