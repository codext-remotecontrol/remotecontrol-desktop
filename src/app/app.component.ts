/* eslint-disable @typescript-eslint/no-inferrable-types */
import { ConnectHelperService } from './core/services/connect-helper.service';
import { SettingsService } from './core/services/settings.service';
import { ConnectService } from './core/services/connect.service';
import { ModalController } from '@ionic/angular';
import { AppService } from './core/services/app.service';
import { AfterViewInit, Component, ChangeDetectorRef } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { ScreenSelectComponent } from './shared/components/screen-select/screen-select.component';
import { ElectronService as NgxService } from 'ngx-electron';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

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

  initDone: boolean = false;

  constructor(
    public electronService: ElectronService,
    private translate: TranslateService,
    public appService: AppService,
    private cdr: ChangeDetectorRef,
    private modalCtrl: ModalController,
    private connectService: ConnectService,
    private settingsService: SettingsService,
    private connectHelperService: ConnectHelperService,
    private ngxService: NgxService,
    private matDialog: MatDialog,
    private route: ActivatedRoute
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
    console.log(
      'this.route.snapshot.queryParams',
      this.route.snapshot.queryParams
    );

    if (this.ngxService.isElectronApp && !this.route.snapshot.queryParams.id) {
      /*if (this.ngxService.isMacOS) {
        const permissionModal = await this.modalCtrl.create({
          component: MacosPermissionsPage,
          backdropDismiss: false,
        });
        permissionModal.onDidDismiss().then(() => {
          this.screenSelect();
        });
        await permissionModal.present();
      } else {
        this.screenSelect();
      }*/
      this.screenSelect();
    }
  }

  async screenSelect(autoSelect = true) {
    const modal = await this.modalCtrl.create({
      component: ScreenSelectComponent,
      backdropDismiss: false,
      componentProps: {
        autoSelect,
      },
    });
    modal.onDidDismiss().then((data) => {
      if (data?.data) {
        this.connectService.videoSource = data.data;
        !this.initDone ? this.init() : null;
      }
    });
    await modal.present();
  }

  async init() {
    this.initDone = true;

    if (this.settingsService.settings?.randomId) {
      this.connectService.id = `${this.connectHelperService.threeDigit()}${this.connectHelperService.threeDigit()}${this.connectHelperService.threeDigit()}`;
    } else {
      const nodeMachineId = this.ngxService.remote.require('node-machine-id');
      const id = await nodeMachineId.machineId();
      const uniqId = parseInt(id, 36).toString().substring(3, 12);
      this.connectService.id = uniqId;
    }
    this.connectService.idArray = ('' + this.connectService.id).split('');
    this.cdr.detectChanges();

    this.connectService.init(this.connectService.id, this.matDialog);
  }
}
