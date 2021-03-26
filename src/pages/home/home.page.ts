import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';
import SimplePeer from 'simple-peer';
import * as vkey from 'vkey';
import 'webrtc-adapter';
import { parse } from 'zipson';
import { ScreenSelectComponent } from '../../app/shared/components/screen-select/screen-select.component';
import { ElectronService } from './../../app/core/services/electron/electron.service';
import { SocketService } from './../../app/core/services/socket.service';

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
  robot: any;

  userId = 'daniel';

  constructor(
    private modalCtrl: ModalController,
    private cdr: ChangeDetectorRef,
    private loadingCtrl: LoadingController,
    private electronService: ElectronService,
    private socketService: SocketService
  ) {}

  async ngOnInit() {
    this.robot = this.electronService.remote.require('robotjs');
    this.robot.setMouseDelay(5);

    this.myId = `${this.threeDigit()} ${this.threeDigit()} ${this.threeDigit()}`;
    this.cdr.detectChanges();

    console.log('this.myId', this.myId);
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
    console.log('source', source);

    const stream = source.stream;
    const height = stream.getVideoTracks()[0].getSettings().height;
    const width = stream.getVideoTracks()[0].getSettings().width;

    console.log(width, height);

    this.peer1 = new SimplePeer({
      initiator: true,
      stream: stream,
      channelName: 'danieltester1235',
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
    this.peer1.on('error', () => {});

    this.socketService.onNewMessage().subscribe((data: any) => {
      this.peer1.signal(data);
    });

    this.peer1.on('data', (data) => {
      try {
        let text = new TextDecoder('utf-8').decode(data);
        if (text.startsWith('{')) {
          text = JSON.parse(text);
          this.handleKey(text);
        } else {
          this.handleMouse(text);
        }
      } catch (error) {
        console.log('error', error);
      }
    });

    this.socketService.onNewMessage('remoteData').subscribe((data: any) => {
      // this.handleRemoteData(data);
    });
  }

  handleMouse(text) {
    const textArray = text.split(',');
    const data = {
      t: textArray[0],
      x: textArray[1],
      y: textArray[2],
      b: textArray[3] || 0,
    };

    switch (data.t) {
      case 'dc': {
        this.robot.mouseClick(data.b == 2 ? 'right' : 'left', 'double');
        break;
      }
      case 'md': {
        this.robot.mouseToggle('down', data.b == 2 ? 'right' : 'left');
        break;
      }
      case 'mu': {
        this.robot.mouseToggle('up', data.b == 2 ? 'right' : 'left');
        break;
      }
      case 'mm': {
        this.robot.dragMouse(data.x, data.y);
        break;
      }
    }
  }

  handleKey(data) {
    const robot = this.robot;
    let k = vkey[data.keyCode].toLowerCase();
    if (k === '<space>') k = ' ';
    const modifiers = [];
    if (data.shift) modifiers.push('shift');
    if (data.control) modifiers.push('control');
    if (data.alt) modifiers.push('alt');
    if (data.meta) modifiers.push('command');
    if (k[0] !== '<') {
      if (modifiers[0]) robot.keyTap(k, modifiers[0]);
      else robot.keyTap(k);
    } else {
      if (k === '<enter>') robot.keyTap('enter');
      else if (k === '<backspace>') robot.keyTap('backspace');
      else if (k === '<up>') robot.keyTap('up');
      else if (k === '<down>') robot.keyTap('down');
      else if (k === '<left>') robot.keyTap('left');
      else if (k === '<right>') robot.keyTap('right');
      else if (k === '<delete>') robot.keyTap('delete');
      else if (k === '<home>') robot.keyTap('home');
      else if (k === '<end>') robot.keyTap('end');
      else if (k === '<page-up>') robot.keyTap('pageup');
      else if (k === '<page-down>') robot.keyTap('pagedown');
      else console.log('did not type ', k);
    }
  }

  threeDigit() {
    return Math.floor(Math.random() * (999 - 100 + 1) + 100);
  }

  async connect() {
    const loading = await this.loadingCtrl.create();
    loading.present();
    setTimeout(() => {
      loading.dismiss();
    }, 1000);
  }
}
