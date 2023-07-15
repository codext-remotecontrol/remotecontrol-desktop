import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ScreenSelectModule } from '../../app/shared/components/screen-select/screen-select.module';
import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { NumberDirective } from './number.directive';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        HomePageRoutingModule,
        TranslateModule,
        ScreenSelectModule,
    ],
    declarations: [HomePage, NumberDirective],
})
export class HomePageModule {}
