import { Component, OnInit } from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';
import SimplePeer from 'simple-peer';
import * as url from 'url';
import * as vkey from 'vkey';
import 'webrtc-adapter';
import { ScreenSelectComponent } from '../../app/shared/components/screen-select/screen-select.component';
import { ElectronService } from './../../app/core/services/electron/electron.service';
import { SocketService } from './../../app/core/services/socket.service';
import { AppConfig } from './../../environments/environment';
import Swal from 'sweetalert2';
import { ElectronService as NgxService } from 'ngx-electron';
// import { hasScreenCapturePermission } from 'mac-screen-capture-permissions';
import { MacosPermissionsPage } from '../../app/shared/components/macos-permissions/macos-permissions.page';

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
  initDone = false;

  constructor(
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    public electronService: ElectronService,
    private socketService: SocketService,
    private ngxService: NgxService
  ) {}

  async ngOnInit() {
    // this.showInfoWindow();
    if (this.ngxService.isElectronApp) {
      this.robot = this.ngxService.remote?.require('robotjs');
      this.robot?.setMouseDelay(0);
      this.robot?.setKeyboardDelay(0);

      if (this.ngxService.isMacOS) {
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
      }
    }
  }

  async screenSelect() {
    const modal = await this.modalCtrl.create({
      component: ScreenSelectComponent,
      backdropDismiss: false,
    });
    modal.onDidDismiss().then((data) => {
      if (data?.data) {
        this.videoSource = data.data;
        !this.initDone ? this.init() : null;
      }
    });
    await modal.present();
  }

  async init() {
    this.initDone = true;
    this.ngxService.screen.on('display-metrics-changed', () => {
      this.sendScreenSize();
    });

    const nodeMachineId = this.ngxService.remote.require('node-machine-id');
    const id = await nodeMachineId.machineId();

    const uniqId = parseInt(id, 36).toString().substring(3, 12);
    console.log(id, uniqId);

    this.id = uniqId; // `${this.threeDigit()}${this.threeDigit()}${this.threeDigit()}`;
    this.idArray = ('' + this.id).split('');

    this.socketService.joinRoom(this.id);

    this.socketService.onNewMessage().subscribe((data: any) => {
      console.log('onNewMessage', data);
      if (data == 'hi') {
        this.sendScreenSize();
        this.videoConnector(this.videoSource);
      } else {
        this.peer1.signal(data);
      }
    });
  }

  sendScreenSize() {
    const { width, height } = this.ngxService.screen.getPrimaryDisplay().size;
    this.socketService.sendMessage(`screenSize,${width},${height}`);
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

    this.peer1.on('connect', () => {
      console.log('connect');
    });

    this.peer1.on('data', (data) => {
      if (data) {
        try {
          let text = new TextDecoder('utf-8').decode(data);
          if (text.substring(0, 1) == '{') {
            text = JSON.parse(text);
            this.handleKey(text);
          } else if (text.substring(0, 1) == 's') {
            this.handleScroll(text);
          } else {
            this.handleMouse(text);
          }
        } catch (error) {
          console.log('error', error);
        }
      }
    });
  }

  handleScroll(text) {
    const textArray = text.split(',');
    const data = {
      t: textArray[0],
      ud: textArray[1],
    };
    this.robot.scrollMouse(0, data.ud == 'up' ? 50 : -50);
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
        if (this.ngxService.isMacOS) {
          this.robot.mouseClick(data.b == 2 ? 'right' : 'left', 'double');
        }
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
    console.log('data', data);
    const k = data.key;
    // let k = vkey[data.keyCode].toLowerCase();
    // robot.keyTap(data.key);

    const modifiers = [];
    if (data.shift) modifiers.push('shift');
    if (data.control) modifiers.push('control');
    if (data.alt) modifiers.push('alt');
    if (data.meta) modifiers.push('command');
    if (k === 'Enter') robot.keyTap('enter');
    else if (k === 'Backspace') robot.keyTap('backspace');
    else if (k === 'ArrowUp') robot.keyTap('up');
    else if (k === 'ArrowDown') robot.keyTap('down');
    else if (k === 'ArrowLeft') robot.keyTap('left');
    else if (k === 'ArrowRight') robot.keyTap('right');
    else if (k === 'Escape') robot.keyTap('escape');
    else if (k === '<delete>') robot.keyTap('delete');
    else if (k === 'Meta') robot.keyTap('home');
    else if (k === '<end>') robot.keyTap('end');
    else if (k === 'PageUp') robot.keyTap('pageup');
    else if (k === 'PageDown') robot.keyTap('pagedown');
    else {
      if (modifiers[0]) robot.keyTap(k, modifiers[0]);
      else robot.keyTap(k);
    }
  }

  threeDigit() {
    return Math.floor(Math.random() * (999 - 100 + 1) + 100);
  }

  connect() {
    const ids = this.remoteIdArray.map((item) => {
      return item['number'];
    });
    const id = ids.join('');
    if (id.length != 9) {
      Swal.fire({
        title: 'Info',
        text: 'Die ID ist nicht vollständig',
        icon: 'info',
        showCancelButton: false,
      });
      return;
    }

    if (this.ngxService.isElectronApp) {
      const appPath = this.electronService.remote.app.getAppPath();

      try {
        const BrowserWindow = this.electronService.remote.BrowserWindow;
        const win = new BrowserWindow({
          height: 600,
          width: 800,
          minWidth: 250,
          minHeight: 250,
          titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
          frame: process.platform === 'darwin' ? true : false,
          center: true,
          show: false,
          backgroundColor: '#252a33',
          webPreferences: {
            webSecurity: false,
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
                appPath,
                'dist/index.html'
              ),
              hash: '/remote?id=' + id,
              protocol: 'file:',
              slashes: true,
            })
          );
        } else {
          win.loadURL('http://localhost:4200/#/remote?id=' + id);
          win.webContents.openDevTools();
        }

        win.maximize();
        win.show();
        win.on('closed', () => {
          Swal.fire({
            title: 'Info',
            text: 'Sitzung geschlossen',
            icon: 'info',
            showCancelButton: false,
          });
        });
      } catch (error) {
        console.log('error', error);
      }
    } else {
      window.open('http://192.168.1.30:4200/#/remote?id=' + id, '_blank');
    }
  }

  showInfoWindow() {
    if (this.ngxService.isElectronApp) {
      const appPath = this.electronService.remote.app.getAppPath();
      try {
        const BrowserWindow = this.electronService.remote.BrowserWindow;
        const win = new BrowserWindow({
          height: 50,
          width: 50,
          x: 0,
          y: 20,
          resizable: false,
          show: false,
          frame: false,
          backgroundColor: '#252a33',
          webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            allowRunningInsecureContent: true,
            contextIsolation: false,
            enableRemoteModule: true,
          },
        });
        win.setAlwaysOnTop(true, 'status');

        if (AppConfig.production) {
          win.loadURL(
            url.format({
              pathname: this.electronService.path.join(
                appPath,
                'dist/index.html'
              ),
              hash: '/info-window',
              protocol: 'file:',
              slashes: true,
            })
          );
        } else {
          win.loadURL('http://localhost:4200/#/info-window');
        }
        win.show();
      } catch (error) {
        console.log('error', error);
      }
    } else {
      window.open('http://192.168.1.30:4200/#/info-window', '_blank');
    }
  }
}
