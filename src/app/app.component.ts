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

  ngAfterViewInit() {
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

  async screenSelect(autoSelect = true, replaceVideo?) {
    const modal = await this.modalCtrl.create({
      component: ScreenSelectComponent,
      backdropDismiss: false,
      componentProps: {
        autoSelect,
      },
    });
    modal.onDidDismiss().then((data) => {
      if (data?.data) {
        if (replaceVideo) {
          this.connectService.replaceVideo(data.data.stream);
        } else {
          this.connectService.videoSource = data.data;
          !this.initDone ? this.init() : null;
        }
      }
    });
    await modal.present();
  }

  async init() {
    this.initDone = true;
    await this.connectService.init(this.matDialog);
  }
}
