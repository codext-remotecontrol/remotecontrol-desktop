import { AfterViewInit, Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AppConfig } from '../environments/environment';
import { ElectronService } from './core/services/electron.service';
import { AppService } from './core/services/app.service';
import { ConnectService } from './core/services/connect.service';
import { SettingsService } from './core/services/settings.service';
import { ScreenSelectComponent } from './shared/components/screen-select/screen-select.component';

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
        { title: {{' Address book '|translate}}, url: '/address-book', icon: 'book-outline' },
    ];

    initDone: boolean = false;

    isRemote: boolean = false;
    isInfoWindow: boolean = false;

    constructor(
        public electronService: ElectronService,
        public appService: AppService,
        private modalCtrl: ModalController,
        private connectService: ConnectService,
        private settingsService: SettingsService
    ) {
        console.log('AppConfig', AppConfig);
    }

    async ngAfterViewInit() {
        if (this.electronService.isElectron) {
            this.appPages.push({
                title: {{' Settings '|translate}},
                url: '/settings',
                icon: 'cog-outline',
            });
            const nut = this.electronService.nutJs;
            nut.keyboard.config = { autoDelayMs: 0 };
            nut.mouse.config = { autoDelayMs: 0, mouseSpeed: 1000 };
            // nut.keyboard.nativeAdapter.keyboard.setKeyboardDelay(0);

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
            await this.settingsService.load();
            if (window.location.href.includes('id=')) {
                this.isRemote = true;
            } else if (window.location.href.includes('info-window')) {
                this.isRemote = true;
                this.isInfoWindow = true;
            } else {
                this.screenSelect();
            }
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
        modal.onDidDismiss().then(data => {
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
        await this.connectService.init();
    }
}
