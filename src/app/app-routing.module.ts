import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomePage } from '../pages/home/home.page';
import { RemotePage } from '../pages/remote/remote.page';
import { SettingsPage } from '../pages/settings/settings.page';
import { AddressBookPage } from '../pages/address-book/address-book.page';
import { InfoWindowPage } from '../pages/info-window/info-window.page';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomePage,
  },
  {
    path: 'remote/:id',
    component: RemotePage,
  },
  {
    path: 'remote',
    component: RemotePage,
  },
  {
    path: 'settings',
    component: SettingsPage,
  },
  {
    path: 'address-book',
    component: AddressBookPage,
  },
  {
    path: 'info',
    component: InfoWindowPage,
  },
  {
    path: 'info-window',
    component: InfoWindowPage,
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
