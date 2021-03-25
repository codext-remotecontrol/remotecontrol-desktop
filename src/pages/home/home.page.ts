import { SocketService } from './../../app/core/services/socket.service';
import { ElectronService } from './../../app/core/services/electron/electron.service';

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import 'webrtc-adapter';
import { LoadingController, ModalController } from '@ionic/angular';
import { ScreenSelectComponent } from '../../app/shared/components/screen-select/screen-select.component';
import SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  myId = '';

  signalData = '';
  peer1;
  socket: any;

  userId = 'daniel';

  constructor(
    private modalCtrl: ModalController,
    private cdr: ChangeDetectorRef,
    private loadingCtrl: LoadingController,
    private electronService: ElectronService,
    private socketService: SocketService
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
    this.peer1 = new SimplePeer({
      initiator: true,
      stream: stream,
      channelName: 'danieltester123',
      config: {
        iceServers: [
          {
            urls: ['stun:turn.codext.de', 'stun:stun.nextcloud.com:443'],
          },
          {
            username: 'Z1VCyC6DDDrwtgeipeplGmJ0',
            credential: '8a630ce342e1ec3fb2b8dbc8eaa395f837038ddcc5',
            urls: [
              'turn:turn.codext.de:80?transport=udp',
              'turn:turn.codext.de:80?transport=tcp',
              'turns:turn.codext.de:443?transport=tcp',
            ],
          },
        ],
      },
    });

    this.peer1.on('signal', (data) => {
      this.socketService.sendMessage(data);
    });

    this.socketService.onNewMessage().subscribe((data: any) => {
      this.peer1.signal(data.msg);
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
