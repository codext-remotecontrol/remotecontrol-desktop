import { Component } from '@angular/core';
import { ElectronService } from './services/electron.service';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public version: string = '1';
  public appPages = [
    {
      title: 'Home',
      url: '/',
      icon: 'home',
    },

    /* {
      title: 'Iventarisierung',
      url: '/inventar',
      icon: 'list'
    }*/
  ];
  constructor(
    public electronService: ElectronService,
    private translate: TranslateService,
    private router: Router
  ) {
    translate.setDefaultLang('en');
    console.log('AppConfig', AppConfig);

    if (electronService.isElectron()) {
      console.log('Mode electron');
      console.log('Electron ipcRenderer', electronService.ipcRenderer);
      console.log('NodeJS childProcess', electronService.childProcess);

      console.log(this.electronService.upload);

      if (this.electronService.upload) {
        this.router.navigateByUrl('inventar');
      }
    } else {
      console.log('Mode web');
    }
  }
}
