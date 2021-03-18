import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame, remote, desktopCapturer } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AlertController } from '@ionic/angular';
@Injectable()
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  desktopCapturer: typeof desktopCapturer;

  webFrame: typeof webFrame;
  remote: typeof remote;
  childProcess: typeof childProcess;
  fs: typeof fs;
  path: typeof path;

  os: typeof os;
  window: any;

  upload: boolean = false;

  constructor(private alertController: AlertController) {
    // Conditional imports
    console.log(window.require('electron').remote);
    if (this.isElectron()) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.remote = window.require('electron').remote;
      this.window = this.remote.getCurrentWindow();
      this.desktopCapturer = window.require('electron').desktopCapturer;

      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');
      this.os = window.require('os');
      this.path = window.require('path');

      const args = this.remote.process.argv.slice(1);
      this.upload = args.some((val) => val === '--upload');
    }
  }

  isElectron = () => {
    return window && window.process && window.process.type;
  };

  minimize() {
    this.window.minimize();
  }

  maximize() {
    if (!this.window.isMaximized()) {
      this.window.maximize();
    } else {
      this.window.unmaximize();
    }
  }

  close() {
    this.window.hide();
  }

  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  async presentAlert(message) {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Info',
        message: message,
        buttons: [
          {
            text: 'Ok',
            handler: () => {
              resolve();
            },
          },
        ],
      });

      await alert.present();
    });
  }
}
