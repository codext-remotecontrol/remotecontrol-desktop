import { TranslateModule } from '@ngx-translate/core';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SettingsPageRoutingModule } from './settings-routing.module';

import { SetPwDialog, SettingsPage } from './settings.page';
import { PasswordCheckModule } from '../../app/shared/components/password-check/password-check.module';
@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        SettingsPageRoutingModule,
        TranslateModule,
        PasswordCheckModule,
    ],
    declarations: [SettingsPage, SetPwDialog],
})
export class SettingsPageModule {}
