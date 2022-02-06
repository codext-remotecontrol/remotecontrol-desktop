import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { AppConfig } from './environments/environment';
import * as Sentry from '@sentry/angular';
import { Integrations } from '@sentry/tracing';



if (AppConfig.production) {
  Sentry.init({
    dsn: 'https://70e58945567645c7be269a0b55cb1e0e@sentry.codext.de/12',
    integrations: [
      new Integrations.BrowserTracing({
        tracingOrigins: ['localhost'],
        routingInstrumentation: Sentry.routingInstrumentation,
      }),
    ],
  });
  enableProdMode();
  if (window) {
    window.console.log = () => {};
    window.console.warn = () => {};
    window.console.info = () => {};
  }
}

platformBrowserDynamic()
  .bootstrapModule(AppModule, {
    preserveWhitespaces: false,
  })
  .catch((err) => console.error(err));
