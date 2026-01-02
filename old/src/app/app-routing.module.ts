import { InfoWindowPageModule } from './../pages/info-window/info-window.module';
import { SettingsPageModule } from '../pages/settings/settings.module';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomePageModule } from '../pages/home/home.module';
import { RemotePageModule } from '../pages/remote/remote.module';
import { PageNotFoundComponent } from './shared/components';
import { AddressBookPageModule } from '../pages/address-book/address-book.module';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
    },
    {
        path: 'home',
        loadChildren: () => HomePageModule,
    },
    {
        path: 'remote',
        loadChildren: () => RemotePageModule,
    },
    {
        path: 'info-window',
        loadChildren: () => InfoWindowPageModule,
    },
    {
        path: 'settings',
        loadChildren: () => SettingsPageModule,
    },
    {
        path: 'address-book',
        loadChildren: () => AddressBookPageModule,
    },
    {
        path: '**',
        component: PageNotFoundComponent,
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
