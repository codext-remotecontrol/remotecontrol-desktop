import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { Router, RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import * as Sentry from '@sentry/angular';

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
import { LottieModule } from 'ngx-lottie';
import player from 'lottie-web';
import { popperVariation, provideTippyConfig, TippyDirective, tooltipVariation } from '@ngneat/helipopper';

export function playerFactory() {
    return player;
}

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        HttpClientModule,
        CoreModule,
        SharedModule,
        AppRoutingModule,
        LottieModule.forRoot({ player: playerFactory }),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
        IonicModule.forRoot(),
        TippyDirective
    ],
    providers: [
        provideTippyConfig({
            defaultVariation: 'tooltip',
            variations: {
              tooltip: tooltipVariation,
              popper: popperVariation,
            }
          }),
        {
            provide: ErrorHandler,
            useValue: Sentry.createErrorHandler({
                showDialog: false,
            }),
        },
        {
            provide: Sentry.TraceService,
            deps: [Router],
        },
        {
            provide: APP_INITIALIZER,
            useFactory: () => () => {},
            deps: [Sentry.TraceService],
            multi: true,
        },
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
