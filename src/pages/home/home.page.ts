import { AppConfig } from './../../environments/environment';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';
import SimplePeer from 'simple-peer';
import * as vkey from 'vkey';
import 'webrtc-adapter';
import { parse } from 'zipson';
import { ScreenSelectComponent } from '../../app/shared/components/screen-select/screen-select.component';
import { ElectronService } from './../../app/core/services/electron/electron.service';
import { SocketService } from './../../app/core/services/socket.service';
import * as url from 'url';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  id = '';
  idArray = [];
  remoteIdArray = [{}, {}, {}, {}, {}, {}, {}, {}, {}];
  remoteId = '';

  signalData = '';
  peer1;
  socket: any;
  robot: any;

  userId = 'daniel';

  videoSource;

  dbl = false;

  constructor(
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private electronService: ElectronService,
    private socketService: SocketService
  ) {}

  async ngOnInit() {
    this.robot = this.electronService.remote?.require('robotjs');
    this.robot.setMouseDelay(5);

    this.id = `${this.threeDigit()}${this.threeDigit()}${this.threeDigit()}`;
    this.idArray = ('' + this.id).split('');

    this.socketService.joinRoom(this.id);
    this.socketService.onNewMessage().subscribe((data: any) => {
      this.peer1.signal(data);
    });

    const modal = await this.modalCtrl.create({
      component: ScreenSelectComponent,
      backdropDismiss: false,
    });
    modal.onDidDismiss().then((data) => {
      if (data?.data) {
        this.videoSource = data.data;
      }
    });
    await modal.present();
  }

  onDigitInput(event) {
    let element;
    if (event.code !== 'Backspace')
      element = event.srcElement.nextElementSibling;

    if (event.code === 'Backspace')
      element = event.srcElement.previousElementSibling;

    if (element == null) return;
    else element.focus();
  }

  start() {
    this.videoConnector(this.videoSource);
  }

  videoConnector(source) {
    console.log('videoConnector', source);
    const stream = source.stream;
    this.peer1 = new SimplePeer({
      initiator: true,
      stream: stream,
      channelName: this.id,
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
        // this.robot.mouseClick(data.b == 2 ? 'right' : 'left', 'double');
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
    const ids = this.remoteIdArray.map((item) => {
      return item['number'];
    });
    const id = ids.join('');
    if (id.length != 9) {
      return;
    }

    try {
      const BrowserWindow = this.electronService.remote.BrowserWindow;
      const win = new BrowserWindow({
        height: 600,
        width: 800,
        frame: false,
        center: true,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          allowRunningInsecureContent: true,
          contextIsolation: false,
          enableRemoteModule: true,
        },
      });

      if (AppConfig.production) {
        win.loadURL(
          url.format({
            pathname: this.electronService.path.join(
              __dirname,
              'dist/index.html/#/remote?id=' + id
            ),
            protocol: 'file:',
            slashes: true,
          })
        );
      } else {
        win.loadURL('http://localhost:4200/#/remote?id=' + id);
      }

      win.maximize();
      win.show();
    } catch (error) {
      console.log('error', error);
    } finally {
    }
  }
}
