import { MacosPermissionsPageModule } from './../../app/shared/components/macos-permissions/macos-permissions.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomePageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';
import { NumberDirective } from './number.directive';

@NgModule({
  imports: [
    MacosPermissionsPageModule,
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
  ],
  declarations: [HomePage, NumberDirective],
})
export class HomePageModule {}
