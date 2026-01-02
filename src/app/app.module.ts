import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, provideHttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// Pages
import { HomePage } from '../pages/home/home.page';
import { RemotePage } from '../pages/remote/remote.page';
import { SettingsPage } from '../pages/settings/settings.page';
import { AddressBookPage } from '../pages/address-book/address-book.page';
import { InfoWindowPage } from '../pages/info-window/info-window.page';

// Components
import { ScreenSelectComponent } from './shared/components/screen-select/screen-select.component';
import { PermissionDialogComponent } from './shared/components/permission-dialog/permission-dialog.component';
import { PasswordDialogComponent } from './shared/components/password-dialog/password-dialog.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomePage,
    RemotePage,
    SettingsPage,
    AddressBookPage,
    InfoWindowPage,
    ScreenSelectComponent,
    PermissionDialogComponent,
    PasswordDialogComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
      defaultLanguage: 'en',
    }),
  ],
  providers: [
    provideHttpClient(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
