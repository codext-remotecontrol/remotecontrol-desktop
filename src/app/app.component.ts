import { AppService } from './core/services/app.service';
import { AfterViewInit, Component } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import * as drag from 'electron-drag';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  platform = window.process;
  process = window.process;
  version = '##version##';

  appPages = [
    { title: 'Home', url: '/home', icon: 'code-working-outline' },
    { title: 'Adressbuch', url: '/address-book', icon: 'book-outline' },
    { title: 'Einstellungen', url: '/settings', icon: 'cog-outline' },
  ];

  constructor(
    public electronService: ElectronService,
    private translate: TranslateService,
    public appService: AppService
  ) {
    this.translate.setDefaultLang('de');
    console.log('AppConfig', AppConfig);
  }

  ngAfterViewInit() {
    console.log('drag', drag);
    drag('#title-bar');
  }
}
