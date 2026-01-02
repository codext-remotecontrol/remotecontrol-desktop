import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ScreenSelectModule } from '../../app/shared/components/screen-select/screen-select.module';
import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { NumberDirective } from './number.directive';
import { TippyDirective } from '@ngneat/helipopper';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        HomePageRoutingModule,
        TranslateModule,
        ScreenSelectModule,
        TippyDirective,
    ],
    declarations: [HomePage, NumberDirective],
})
export class HomePageModule {}
