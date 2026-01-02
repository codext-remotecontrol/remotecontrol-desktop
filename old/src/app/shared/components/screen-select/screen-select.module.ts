import { TranslateModule } from '@ngx-translate/core';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { ScreenSelectComponent } from './screen-select.component';

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
    declarations: [ScreenSelectComponent],
})
export class ScreenSelectModule {}
