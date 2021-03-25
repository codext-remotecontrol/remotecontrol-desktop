import { ElectronService } from './../../app/core/services/electron/electron.service';

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import 'webrtc-adapter';
import { LoadingController, ModalController } from '@ionic/angular';
import { ScreenSelectComponent } from '../../app/shared/components/screen-select/screen-select.component';
import SimplePeer from 'simple-peer';
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  myId = '';

  constructor(
    private modalCtrl: ModalController,
    private cdr: ChangeDetectorRef,
    private loadingCtrl: LoadingController,
    private electronService: ElectronService
  ) {}

  async ngOnInit() {
    this.myId = `${this.threeDigit()} ${this.threeDigit()} ${this.threeDigit()}`;
    this.cdr.detectChanges();
    console.log(' this.myId', this.myId);
    const modal = await this.modalCtrl.create({
      component: ScreenSelectComponent,
      backdropDismiss: false,
    });
    modal.onDidDismiss().then((data) => {
      if (data?.data) {
        this.videoConnector(data.data);
      }
    });
    return await modal.present();
  }

  videoConnector(source) {
    const stream = source.stream;
    const peer1 = new SimplePeer({ initiator: true, stream: stream });
    const peer2 = new SimplePeer();

    peer1.on('signal', (data) => {
      peer2.signal(data);
    });

    peer2.on('signal', (data) => {
      peer1.signal(data);
    });

    peer2.on('stream', (stream) => {
      const video = document.querySelector('video');
      video.srcObject = stream;
      video.play();
    });
  }

  test() {
    const robot = this.electronService.remote.require('robotjs');
    robot.setMouseDelay(2);

    const twoPI = Math.PI * 2.0;
    const screenSize = robot.getScreenSize();
    const height = screenSize.height / 2 - 10;
    const width = screenSize.width;

    for (let x = 0; x < width; x++) {
      const y = height * Math.sin((twoPI * x) / width) + height;
      robot.moveMouse(x, y);
    }
  }

  threeDigit() {
    return Math.floor(Math.random() * (999 - 100 + 1) + 100);
  }

  async connect() {
    const loading = await this.loadingCtrl.create();
    loading.present();
    setTimeout(() => {
      /*const remote = this.electronService.remote;
      const BrowserWindow = remote.BrowserWindow;
      const win = new BrowserWindow({
        width: 400,
        height: 400,
        frame: false,
        center: true,
        webPreferences: {
          nodeIntegration: true,
          allowRunningInsecureContent: true,
          contextIsolation: false,
          enableRemoteModule: true,
        },
      });

      win.loadURL("http://google.de");*/
      loading.dismiss();
    }, 1000);
  }
}
