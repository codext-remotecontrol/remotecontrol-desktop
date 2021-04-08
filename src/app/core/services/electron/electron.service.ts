import { Injectable } from '@angular/core';
import {
  ipcRenderer,
  webFrame,
  desktopCapturer,
  remote,
  BrowserWindow,
  screen,
} from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as AutoLaunch from 'auto-launch';
import * as bcryptjs from 'bcryptjs';
// import * as nutJs from '@nut-tree/nut-js';
import * as settings from 'electron-settings';
import * as autoUpdater from 'electron-updater';
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
  window: BrowserWindow;
  autoLaunch: typeof AutoLaunch;
  settings: typeof settings;
  bcryptjs: typeof bcryptjs;
  autoUpdater: typeof autoUpdater;
  screen: typeof screen;

  // nutJs: typeof nutJs;

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      // this.nutJs = window.require('@nut-tree/nut-js');
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.autoUpdater = window.require('electron-updater');
      this.webFrame = window.require('electron').webFrame;
      this.screen = window.require('electron').screen;
      this.remote = window.require('electron').remote;
      this.os = window.require('os');
      this.autoLaunch = window.require('auto-launch');
      this.bcryptjs = window.require('bcryptjs');
      this.window = window.require('electron').remote.getCurrentWindow();
      this.desktopCapturer = window.require('electron').desktopCapturer;
      this.settings = window.require('electron-settings');

      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');
      this.path = window.require('path');

      this.remote.globalShortcut.register('CommandOrControl+I', () => {
        console.log('CommandOrControl+I');
      });
      this.remote.globalShortcut.register('CommandOrControl+O', () => {
        console.log('CommandOrControl+O');
      });
      this.remote.globalShortcut.register('Control+Shift+I', () => {
        return false;
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

  hide() {
    this.window.hide();
  }

  close() {
    this.window.close();
  }
}
