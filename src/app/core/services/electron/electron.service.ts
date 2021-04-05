import { Injectable } from '@angular/core';

import { ipcRenderer, webFrame, desktopCapturer, remote } from 'electron';
// import * as remote from '@electron/remote';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  desktopCapturer: typeof desktopCapturer;
  webFrame: typeof webFrame;
  remote: typeof remote;
  childProcess: typeof childProcess;
  fs: typeof fs;
  os: typeof os;
  path: typeof path;
  window: any;

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.remote = window.require('electron').remote;
      this.os = window.require('os');
      this.window = window.require('electron').remote.getCurrentWindow();
      this.desktopCapturer = window.require('electron').desktopCapturer;

      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');
      this.path = window.require('path');

      this.remote.globalShortcut.register('CommandOrControl+I', () => {
        console.log('CommandOrControl+I');
        //x.hide();
      });
      this.remote.globalShortcut.register('CommandOrControl+O', () => {
        console.log('CommandOrControl+O');
        //x.show();
      });
    }
  }

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
    const win = window.require('electron').remote.getCurrentWindow();
    win.close();
  }
}
