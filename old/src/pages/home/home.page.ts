/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Component, HostListener, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { UntilDestroy } from '@ngneat/until-destroy';
import 'webrtc-adapter';
import { AddressBookService } from '../../app/core/services/address-book.service';
import { ScreenSelectComponent } from '../../app/shared/components/screen-select/screen-select.component';
import { ConnectService } from './../../app/core/services/connect.service';
import { ElectronService } from './../../app/core/services/electron.service';

@UntilDestroy()
@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
    @HostListener('document:paste', ['$event'])
    onPaste(event) {
        let id: string = event.clipboardData.getData('text');
        id = id.trim().replace(/(\r\n|\n|\r)/gm, '');
        this.connectService.setId(id);
    }

    constructor(
        public electronService: ElectronService,
        private addressBookService: AddressBookService,
        public connectService: ConnectService,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController
    ) {}

    async ngOnInit() {}

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
                    // !this.initDone ? this.init() : null;
                }
            }
        });
        await modal.present();
    }

    onDigitInput(event) {
        console.log('event', event);
        let element;
        if (event.code !== 'Backspace')
            element = event.srcElement.nextElementSibling;

        if (event.code === 'Backspace') {
            element = event.srcElement.previousElementSibling;
            element.value = '';
        }

        if (element == null) return;
        else
            setTimeout(() => {
                element.focus();
            }, 10);
    }

    async connect() {
        const ids = this.connectService.remoteIdArray.map(item => {
            return item['number'];
        });
        const id = ids.join('');
        if (id.length != 9) {
            const alert = await this.alertCtrl.create({
                header: 'Die ID ist nicht vollständig',
            });
            await alert.present();
            return;
        }

        await this.addressBookService.add({ id: id });
        this.connectService.connect(id);
    }
}
