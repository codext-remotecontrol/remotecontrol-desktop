import { ScreenSelectModule } from './../../app/shared/components/screen-select/screen-select.module';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomePage } from './home.page';

const routes: Routes = [
    {
        path: '',
        component: HomePage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes), ScreenSelectModule],
    exports: [RouterModule],
})
export class HomePageRoutingModule {}
