import { SocketService } from './../../app/core/services/socket.service';
import { ElectronService } from './../../app/core/services/electron/electron.service';

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import 'webrtc-adapter';
import { LoadingController, ModalController } from '@ionic/angular';
import { ScreenSelectComponent } from '../../app/shared/components/screen-select/screen-select.component';
import SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';
import * as vkey from 'vkey';
import { stringify, parse } from 'zipson';
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
      this.peer1.signal(data);
    });

    this.peer1.on('data', (data) => {
      // console.log('data', data);
      try {
        const text = new TextDecoder('utf-8').decode(data);
        // console.log('data', parsed);
        const parsed = parse(text);
        this.handleRemoteData(parsed);
      } catch (error) {
        console.log('error', error);
      }
    });

    this.socketService.onNewMessage('remoteData').subscribe((data: any) => {
      console.log('remoteData', data);
      this.handleRemoteData(data);
    });
  }

  handleRemoteData(data) {
    console.log('Data', data);
    let x, y;
    if (data.t == 'md' || data.t == 'mu' || data.t == 'mm') {
      x = this.scale(data.x, 0, data.w, 0, screen.width);
      y = this.scale(data.y, 0, data.h, 0, screen.height);
    }
    switch (data.t) {
      case 'k': {
        try {
          this.handleKey(data);
        } catch (err) {
          console.log(err);
        }
        break;
      }
      case 'dc': {
        // console.log(x, y);
        // const pos = this.robot.getMousePos(); // hosts current x/y
        // this.robot.moveMouse(x, y); // move to remotes pos
        // this.robot.mouseToggle('up', 'left');
        this.robot.mouseClick(data.b == 2 ? 'right' : 'left', 'double');
        // this.robot.mouseToggle('down', data.b == 2 ? 'right' : 'left');
        // this.robot.mouseClick(data.b == 2 ? 'right' : 'left');
        // this.robot.moveMouse(pos.x, pos.y); // go back to hosts position
        break;
      }
      case 'md': {
        // console.log(x, y);
        // const pos = this.robot.getMousePos(); // hosts current x/y
        // this.robot.moveMouse(x, y); // move to remotes pos
        // this.robot.mouseToggle('up', 'left');

        this.robot.mouseToggle('down', data.b == 2 ? 'right' : 'left');
        // this.robot.mouseClick(data.b == 2 ? 'right' : 'left');
        // this.robot.moveMouse(pos.x, pos.y); // go back to hosts position
        break;
      }
      case 'mu': {
        // console.log(x, y);
        // const pos = this.robot.getMousePos(); // hosts current x/y
        // this.robot.moveMouse(x, y); // move to remotes pos
        // this.robot.mouseToggle('up', 'left');
        this.robot.mouseToggle('up', data.b == 2 ? 'right' : 'left');
        // this.robot.mouseClick(data.b == 2 ? 'right' : 'left');
        // this.robot.moveMouse(pos.x, pos.y); // go back to hosts position
        break;
      }
      case 'mm': {
        // console.log(x, y);
        this.robot.dragMouse(x, y);
        break;
      }
    }
  }

  scale(x, fromLow, fromHigh, toLow, toHigh) {
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    return ((x - fromLow) * (toHigh - toLow)) / (fromHigh - fromLow) + toLow;
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
