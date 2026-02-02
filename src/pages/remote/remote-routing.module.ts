import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RemotePage } from './remote.page';

const routes: Routes = [
    {
        path: '',
        component: RemotePage,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class RemotePageRoutingModule {}
