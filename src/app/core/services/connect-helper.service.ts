import { BrowserWindow } from 'electron';
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { ElectronService } from './electron/electron.service';
import { ElectronService as NgxService } from 'ngx-electron';
import { Injectable } from '@angular/core';
import { AppConfig } from '../../../environments/environment';
import * as url from 'url';
@Injectable({
  providedIn: 'root',
})
export class ConnectHelperService {
  robot: any;
  infoWindow: BrowserWindow;

  constructor(
    private electronService: ElectronService,
    private ngxService: NgxService
  ) {
    this.robot = this.ngxService.remote?.require('robotjs');
    this.robot?.setMouseDelay(0);
    this.robot?.setKeyboardDelay(0);
  }

  handleScroll(text) {
    const textArray = text.split(',');
    const data = {
      t: textArray[0],
      ud: textArray[1],
    };
    data.ud == 'up'
      ? this.electronService.nutJs.mouse.scrollUp(50)
      : this.electronService.nutJs.mouse.scrollDown(50);
    // this.robot.scrollMouse(0, data.ud == 'up' ? 50 : -50);
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
          // this.robot.mouseClick(data.b == 2 ? 'right' : 'left', 'double');

          this.electronService.nutJs.mouse.leftClick();
          setTimeout(() => {
            this.electronService.nutJs.mouse.leftClick();
          }, 50);
        }
        break;
      }
      case 'md': {
        //this.robot.mouseToggle('down', data.b == 2 ? 'right' : 'left');
        this.electronService.nutJs.mouse.pressButton(data.b == 2 ? 2 : 0);
        break;
      }
      case 'mu': {
        // this.robot.mouseToggle('up', data.b == 2 ? 'right' : 'left');
        this.electronService.nutJs.mouse.releaseButton(data.b == 2 ? 2 : 0);
        break;
      }
      case 'mm': {
        // this.robot.dragMouse(data.x, data.y);

        this.electronService.nutJs.mouse.setPosition({
          x: +data.x,
          y: +data.y,
        });
        break;
      }
    }
  }

  threeDigit() {
    return Math.floor(Math.random() * (999 - 100 + 1) + 100);
  }

  handleKey(data) {
    const robot = this.robot;
    const k = data.key;
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

  closeInfoWindow() {
    if (this.ngxService.isElectronApp) {
      try {
        this.infoWindow?.close();
        // eslint-disable-next-line no-empty
      } catch (error) {}
    }
  }

  showInfoWindow() {
    if (this.ngxService.isElectronApp) {
      const appPath = this.electronService.remote.app.getAppPath();
      try {
        const BrowserWindow = this.electronService.remote.BrowserWindow;
        /*const {
          height,
        } = this.electronService.screen.getPrimaryDisplay().workAreaSize;*/
        this.infoWindow = new BrowserWindow({
          height: 50,
          width: 50,
          x: 0,
          y: 100, //height / 2 - 50,
          resizable: false, // AppConfig.production ? false : true,
          show: false,
          frame: false,
          transparent: true,
          backgroundColor: '#252a33',
          webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            allowRunningInsecureContent: true,
            contextIsolation: false,
            enableRemoteModule: true,
          },
        });
        this.infoWindow.setAlwaysOnTop(true, 'status');

        if (AppConfig.production) {
          this.infoWindow.loadURL(
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
          this.infoWindow.loadURL('http://localhost:4200/#/info-window');
          // this.infoWindow.webContents.openDevTools();
        }
        this.infoWindow.show();
      } catch (error) {
        console.log('error', error);
      }
    } else {
      window.open('http://192.168.1.30:4200/#/info-window', '_blank');
    }
  }
}
