/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoadingController, ModalController } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ElectronService as NgxService } from 'ngx-electron';
import SimplePeer from 'simple-peer';
import Swal from 'sweetalert2';
import * as url from 'url';
import 'webrtc-adapter';
import { MacosPermissionsPage } from '../../app/shared/components/macos-permissions/macos-permissions.page';
import { ScreenSelectComponent } from '../../app/shared/components/screen-select/screen-select.component';
import { ElectronService } from './../../app/core/services/electron/electron.service';
import { SocketService } from './../../app/core/services/socket.service';
import { AppConfig } from './../../environments/environment';
import SimplePeerFiles from 'simple-peer-files';

@Component({
  template: `
    <div mat-dialog-title>Neue Verbindung</div>
    <div
      mat-dialog-actions
      style="
    flex-wrap: nowrap;"
    >
      <button mat-button (click)="decline()">
        {{ 'decline' | translate }}
      </button>
      <button mat-button cdkFocusInitial (click)="accept()">
        {{ 'Accept' | translate }}
      </button>
    </div>
  `,
})
export class AskForPermissionDialog {
  constructor(
    public dialogRef: MatDialogRef<AskForPermissionDialog>,
    private translateService: TranslateService
  ) {}

  accept() {
    this.dialogRef.close(true);
  }

  decline() {
    this.dialogRef.close();
  }
}

@UntilDestroy()
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  id = '';
  idArray = [];
  remoteIdArray = [{}, {}, {}, {}, {}, {}, {}, {}, {}];
  remoteId = '';
  signalData = '';
  peer1: SimplePeer.Instance;
  spf: SimplePeerFiles;
  robot: any;

  videoSource;

  dbl = false;
  initDone = false;

  settings;
  loading;
  transfer;
  files = [];

  @HostListener('document:paste', ['$event'])
  onPaste(event) {
    let id: string = event.clipboardData.getData('text');
    id = id.trim().replace(/(\r\n|\n|\r)/gm, '');
    this.setId(id);
  }

  constructor(
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    public electronService: ElectronService,
    private socketService: SocketService,
    private ngxService: NgxService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.spf = new SimplePeerFiles();
    this.loading = await this.loadingCtrl.create({
      duration: 15000,
    });
    this.socketService.init();
    if (this.ngxService.isElectronApp) {
      const settings: any = await this.electronService.settings.get('settings');
      this.settings = settings;

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

  ngOnDestroy() {
    console.log('ngOnDestroy');
    this.peer1?.destroy();
    this.socketService?.destroy();
  }

  async screenSelect(autoSelect = true) {
    const modal = await this.modalCtrl.create({
      component: ScreenSelectComponent,
      backdropDismiss: false,
      componentProps: {
        autoSelect,
      },
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

    if (this.settings.randomId) {
      this.id = `${this.threeDigit()}${this.threeDigit()}${this.threeDigit()}`;
    } else {
      const nodeMachineId = this.ngxService.remote.require('node-machine-id');
      const id = await nodeMachineId.machineId();
      const uniqId = parseInt(id, 36).toString().substring(3, 12);
      this.id = uniqId;
    }
    this.idArray = ('' + this.id).split('');
    this.cdr.detectChanges();
    this.socketService.joinRoom(this.id);

    this.socketService
      .onNewMessage()
      .pipe(untilDestroyed(this))
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .subscribe(async (data: any) => {
        console.log('onNewMessage', data);
        if (typeof data == 'string' && data == 'hi') {
          await this.loading.present();
          this.sendScreenSize();

          if (this.settings?.hiddenAccess) {
            this.socketService.sendMessage('pwRequest');
            return;
          } else {
            const win = this.electronService.window;
            win.show();
            win.focus();

            const result = await this.askForConnectPermission();
            this.cdr.detectChanges();
            if (!result) {
              this.socketService.sendMessage('decline');
              this.loading.dismiss();
              return;
            }
            this.videoConnector();
          }
        } else if (
          typeof data == 'string' &&
          data.substring(0, 8) == 'pwAnswer'
        ) {
          const pw = data.replace(data.substring(0, 9), '');
          const pwCorrect = await this.electronService.bcrypt.compare(
            pw,
            this.settings.passwordHash
          );
          console.log('pw', pw, pwCorrect);
          if (pwCorrect) {
            this.videoConnector();
          } else {
            this.socketService.sendMessage('pwWrong');
            this.loading.dismiss();
            Swal.fire({
              title: 'Info',
              text: 'Passwort nicht korrekt',
              icon: 'info',
              showCancelButton: false,
              showCloseButton: false,
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
            });
          }
          this.cdr.detectChanges();
        } else if (typeof data == 'string' && data.startsWith('decline')) {
          this.loading.dismiss();
          this.cdr.detectChanges();
        } else {
          this.peer1.signal(data);
        }
      });
  }

  askForConnectPermission() {
    return new Promise((resolve) => {
      const dialogRef = this.dialog.open(AskForPermissionDialog, {
        width: '250px',
      });

      dialogRef.afterClosed().subscribe((result) => {
        resolve(result);
      });
    });
  }

  sendScreenSize() {
    const { width, height } = this.ngxService.screen.getPrimaryDisplay().size;
    this.socketService.sendMessage(`screenSize,${width},${height}`);
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

  videoConnector() {
    this.loading.dismiss();
    const source = this.videoSource;
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

    this.peer1.on('connect', () => {});

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.peer1.on('data', async (data) => {
      if (data) {
        const fileTransfer = data.toString();
        if (fileTransfer.substr(0, 5) === 'file-') {
          const fileID = fileTransfer.substr(5);
          this.spf.receive(this.peer1, fileID).then((transfer: any) => {
            transfer.on('progress', (p) => {
              console.log('progress', p);
            });
            transfer.on('done', (file) => {
              console.log('done', file);
              const element = document.createElement('a');
              element.href = URL.createObjectURL(file);
              element.download = file.name;
              element.click();
            });
          });
          this.peer1.send(`start-${fileID}`);
          return;
        } else if (fileTransfer.substr(0, 6) === 'start-') {
          const fileID = fileTransfer.substr(6);
          this.transfer = await this.spf.send(
            this.peer1,
            fileID,
            this.files[fileID]
          );
          this.transfer.on('progress', (p) => {
            console.log('progress', p);
          });
          this.transfer.on('done', (file) => {
            console.log('done', file);
          });
          this.transfer.start();
          return;
        }

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
          // console.log('error', error);
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
    /*data.ud == 'up'
      ? this.electronService.nutJs.mouse.scrollUp(50)
      : this.electronService.nutJs.mouse.scrollDown(50);*/
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

          // this.electronService.nutJs.mouse.leftClick();
          // this.electronService.nutJs.mouse.leftClick();
        }
        break;
      }
      case 'md': {
        this.robot.mouseToggle('down', data.b == 2 ? 'right' : 'left');
        // this.electronService.nutJs.mouse.pressButton(data.b == 2 ? 2 : 0);
        break;
      }
      case 'mu': {
        this.robot.mouseToggle('up', data.b == 2 ? 'right' : 'left');
        // this.electronService.nutJs.mouse.releaseButton(data.b == 2 ? 2 : 0);
        break;
      }
      case 'mm': {
        this.robot.dragMouse(data.x, data.y);

        /*this.electronService.nutJs.mouse.setPosition({
          x: +data.x,
          y: +data.y,
        });*/
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

  setId(id) {
    if (id.length == 9) {
      const idArray = id.split('').map((number) => {
        return Number(number);
      });

      idArray.forEach((number, index) => {
        this.remoteIdArray[index] = { number };
      });
    }
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
        showCloseButton: false,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
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
          /*Swal.fire({
            title: 'Info',
            text: 'Sitzung geschlossen',
            icon: 'info',
            showCancelButton: false,
            showCloseButton: false,
            timer: 2000,
            timerProgressBar: true,
          });*/
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
            devTools: false,
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
