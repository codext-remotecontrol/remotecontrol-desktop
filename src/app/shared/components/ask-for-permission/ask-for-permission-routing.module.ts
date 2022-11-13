import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AskForPermissionPage } from './ask-for-permission.page';

const routes: Routes = [
    {
        path: '',
        component: AskForPermissionPage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AskForPermissionPageRoutingModule {}
