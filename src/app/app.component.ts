import { AppService } from './core/services/app.service';
import { Component } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  platform = process.platform;
  version = '1';

  appPages = [
    { title: 'Home', url: '/home', icon: 'code-working' },
    { title: 'Einstellungen', url: '/settings', icon: 'cog' },
  ];

  constructor(
    public electronService: ElectronService,
    private translate: TranslateService,
    public appService: AppService
  ) {
    this.translate.setDefaultLang('en');
    console.log('AppConfig', AppConfig);
  }
}
