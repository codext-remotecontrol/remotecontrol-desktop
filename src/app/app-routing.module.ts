import { SettingsPageModule } from '../pages/settings/settings.module';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomePageModule } from '../pages/home/home.module';
import { RemotePageModule } from '../pages/remote/remote.module';
import { PageNotFoundComponent } from './shared/components';

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
    path: 'settings',
    loadChildren: () => SettingsPageModule,
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
