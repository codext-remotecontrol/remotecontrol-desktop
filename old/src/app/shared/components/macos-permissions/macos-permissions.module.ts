import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MacosPermissionsPageRoutingModule } from './macos-permissions-routing.module';

import { MacosPermissionsPage } from './macos-permissions.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        MacosPermissionsPageRoutingModule,
    ],
    declarations: [MacosPermissionsPage],
})
export class MacosPermissionsPageModule {}
