/* eslint-disable @typescript-eslint/await-thenable */
import {
    ChangeDetectorRef,
    Component,
    HostListener,
    Inject,
    OnInit,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import 'webrtc-adapter';
import { ElectronService } from '../../app/core/services/electron.service';
import { ConnectService } from './../../app/core/services/connect.service';

import { ActionSheetController, ModalController, ToastController } from '@ionic/angular';
import { SettingsService } from '../../app/core/services/settings.service';

export interface DialogData {
    pw: string;
    newPw: string;
}
@Component({
    selector: 'set-pw',
    template: `
        <div mat-dialog-content>
            <mat-form-field
                [class.is-invalid]="!newPasswordCheck.correct"
                [class.is-valid]="newPasswordCheck.correct">
                <mat-label>{{ 'Password' | translate }}</mat-label>
                <input
                    matInput
                    [(ngModel)]="data.pw"
                    type="password" />
            </mat-form-field>
            <mat-form-field
                [class.is-invalid]="!newPasswordCheck.correct"
                [class.is-valid]="newPasswordCheck.correct">
                <mat-label>{{ 'Repeat Password' | translate }}</mat-label>
                <input
                    matInput
                    [(ngModel)]="data.newPw"
                    type="password" />
            </mat-form-field>
            <app-password-check
                [password]="data.pw"
                #newPasswordCheck></app-password-check>
        </div>
        <div
            mat-dialog-actions
            style="
    flex-wrap: nowrap;">
            <button
                mat-button
                (click)="cancel()">
                {{ 'Cancel' | translate }}
            </button>
            <button
                mat-button
                (click)="save()"
                [disabled]="
                    !(newPasswordCheck.correct && data.pw === data.newPw)
                ">
                {{ 'Save' | translate }}
            </button>
        </div>
    `,
})
export class SetPwDialog {
    public data: DialogData
    @HostListener('document:keydown.enter', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.save();
    }

    constructor(
        private modalCtrl: ModalController,
        private translateService: TranslateService,
        private toastController: ToastController,
    ) {}

   async save() {
        if (this.data.pw == this.data.newPw) {
            this.modalCtrl.dismiss(this.data, 'cancel')
        } else {
            const toast = await this.toastController.create({
                message: 'Password does not match',
                duration: 2000,
              });

              await toast.present();

        }
    }

    cancel(): void {
        this.modalCtrl.dismiss(this.data, 'cancel')
    }
}

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
    compName = '';
    autoStartEnabled = false;
    autoLaunch;

    hiddenAccess = false;

    constructor(
        private electronService: ElectronService,
        private cdr: ChangeDetectorRef,
        private modalCtrl: ModalController,
        private translate: TranslateService,
        private actionSheetCtrl: ActionSheetController,
        public settingsService: SettingsService,
        private connectService: ConnectService
    ) {}

    ngOnInit() {
        const loginSettings = this.electronService.app.getLoginItemSettings();

        this.autoStartEnabled = loginSettings.executableWillLaunchAtLogin;
        console.log();
        this.compName = this.electronService.os.hostname();
        /* this.autoLaunch = new this.electronService.autoLaunch({
      name: 'Remotecontrol - Desktop',
      path: this.electronService.remote.app.getPath('exe'),
      isHidden: true,
    }); */
        // const isEnabled = await this.autoLaunch.isEnabled();
        // this.autoStartEnabled = false; // isEnabled;
        this.cdr.detectChanges();
    }

    async checkForUpdates() {
        try {
            await this.electronService.autoUpdater.autoUpdater.checkForUpdates();
        } catch (error) {
            console.log('error', error);
        }
    }

    public async selectLanguage(ev): Promise<any> {
        const actionSheetCtrl = await this.actionSheetCtrl.create({
            translucent: true,
            buttons: [
                {
                    text: 'Deutsch',
                    handler: () => {
                        this.changeLanguage({ code: 'de', text: 'Deutsch' });
                    },
                },
                {
                    text: 'English',
                    handler: () => {
                        this.changeLanguage({ code: 'en', text: 'English' });
                    },
                },
            ],
        });

        await actionSheetCtrl.present();
    }

    async changeLanguage(selection: { text: string; code: string }) {
        await this.settingsService.saveSettings({
            language: selection,
        });

        this.settingsService.language = selection;
        this.translate.use(selection.code);
    }

    async changeHiddenAccess() {
        await this.settingsService.saveSettings({
            hiddenAccess: this.settingsService.settings.hiddenAccess,
        });
    }

    async randomIdChange() {
        await this.settingsService.saveSettings({
            randomId: this.settingsService.settings.randomId,
        });
        this.connectService.reconnect();
    }

    async addPw() {
        const modal = await this.modalCtrl.create({
            component: SetPwDialog,
            componentProps: {
                pw: '',
                newPw: '',
            },
          });
          modal.present();

          const { data, role } = await modal.onWillDismiss();
          if (data?.pw) {
            this.setPwHash(data.pw);
        }
    }

    async setPwHash(pw) {
        const hash = await this.electronService.bcryptjs.hash(pw, 5);

        await this.settingsService.saveSettings({
            passwordHash: hash,
        });
    }

    changeAutoStart() {
        if (this.autoStartEnabled) {
            this.electronService.app.setLoginItemSettings({
                openAsHidden: true,
                openAtLogin: true,
                name: 'Remotecontrol Desktop',
                args: ['--hidden'],
            });
        } else {
            this.electronService.app.setLoginItemSettings({
                openAsHidden: false,
                openAtLogin: false,
                name: 'Remotecontrol Desktop',
                args: ['--hidden'],
            });
        }
        /*this.autoLaunch.isEnabled().then((isEnabled) => {
      if (isEnabled) {
        this.autoLaunch.disable();
      } else {
        this.autoLaunch.enable();
      }
    });*/
    }
}
