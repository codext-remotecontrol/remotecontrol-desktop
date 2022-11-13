import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AskForPermissionPageRoutingModule } from './ask-for-permission-routing.module';

import { AskForPermissionPage } from './ask-for-permission.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        AskForPermissionPageRoutingModule,
        MatDialogModule,
        MatButtonModule,
        TranslateModule,
    ],
    declarations: [AskForPermissionPage],
})
export class AskForPermissionPageModule {}
