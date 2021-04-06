import { AppService } from './core/services/app.service';
import { AfterViewInit, Component, ChangeDetectorRef } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';

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
    public appService: AppService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('AppConfig', AppConfig);
  }

  async ngAfterViewInit() {
    const settings: any = await this.electronService.settings.get('settings');

    if (settings?.language) {
      this.translate.setDefaultLang(settings?.language.code);
    } else {
      this.translate.setDefaultLang('de');
    }
    this.cdr.detectChanges();
  }
}
