import { ModalController } from '@ionic/angular';
import { ElectronService } from './../../../core/services/electron.service';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-macos-permissions',
    templateUrl: './macos-permissions.page.html',
    styleUrls: ['./macos-permissions.page.scss'],
})
export class MacosPermissionsPage implements OnInit {
    constructor(
        private electronService: ElectronService,
        private modalCtrl: ModalController
    ) {}

    ngOnInit() {}

    openSettings() {
        /*this.electronService.childProcess.exec(
      'open "x-apple.systempreferences:com.apple.preference.security"'
    );*/
        this.modalCtrl.dismiss();
    }
}
