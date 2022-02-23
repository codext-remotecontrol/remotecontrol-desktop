import { BrowserWindow } from 'electron';
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { ElectronService } from './electron/electron.service';
import { ElectronService as NgxService } from 'ngx-electron';
import { Injectable } from '@angular/core';
import { AppConfig } from '../../../environments/environment';
import * as url from 'url';
import { Key } from '@nut-tree/nut-js/dist/lib/key.enum';

declare var window: any;
@Injectable({
  providedIn: 'root',
})
export class ConnectHelperService {
  public KeyLookupMap = new Map<Key, string | null>([
    [Key.A, 'a'],
    [Key.B, 'b'],
    [Key.C, 'c'],
    [Key.D, 'd'],
    [Key.E, 'e'],
    [Key.F, 'f'],
    [Key.G, 'g'],
    [Key.H, 'h'],
    [Key.I, 'i'],
    [Key.J, 'j'],
    [Key.K, 'k'],
    [Key.L, 'l'],
    [Key.M, 'm'],
    [Key.N, 'n'],
    [Key.O, 'o'],
    [Key.P, 'p'],
    [Key.Q, 'q'],
    [Key.R, 'r'],
    [Key.S, 's'],
    [Key.T, 't'],
    [Key.U, 'u'],
    [Key.V, 'v'],
    [Key.W, 'w'],
    [Key.X, 'x'],
    [Key.Y, 'y'],
    [Key.Z, 'z'],

    [Key.F1, 'f1'],
    [Key.F2, 'f2'],
    [Key.F3, 'f3'],
    [Key.F4, 'f4'],
    [Key.F5, 'f5'],
    [Key.F6, 'f6'],
    [Key.F7, 'f7'],
    [Key.F8, 'f8'],
    [Key.F9, 'f9'],
    [Key.F10, 'f10'],
    [Key.F11, 'f11'],
    [Key.F12, 'f12'],

    [Key.Num0, '0'],
    [Key.Num1, '1'],
    [Key.Num2, '2'],
    [Key.Num3, '3'],
    [Key.Num4, '4'],
    [Key.Num5, '5'],
    [Key.Num6, '6'],
    [Key.Num7, '7'],
    [Key.Num8, '8'],
    [Key.Num9, '9'],
    [Key.NumPad0, 'numpad_0'],
    [Key.NumPad1, 'numpad_1'],
    [Key.NumPad2, 'numpad_2'],
    [Key.NumPad3, 'numpad_3'],
    [Key.NumPad4, 'numpad_4'],
    [Key.NumPad5, 'numpad_5'],
    [Key.NumPad6, 'numpad_6'],
    [Key.NumPad7, 'numpad_7'],
    [Key.NumPad8, 'numpad_8'],
    [Key.NumPad9, 'numpad_9'],

    [Key.Space, 'space'],
    [Key.Escape, 'escape'],
    [Key.Tab, 'tab'],
    [Key.LeftAlt, 'alt'],
    [Key.LeftControl, 'control'],
    [Key.RightAlt, 'alt'],
    [Key.RightControl, 'control'],

    [Key.LeftShift, 'shift'],
    [Key.LeftSuper, 'command'],
    [Key.RightShift, 'space'],
    [Key.RightSuper, 'command'],

    [Key.Grave, '~'],
    [Key.Minus, '-'],
    [Key.Equal, '='],
    [Key.Backspace, 'backspace'],
    [Key.LeftBracket, '['],
    [Key.RightBracket, ']'],
    [Key.Backslash, '\\'],
    [Key.Semicolon, ';'],
    [Key.Quote, "'"],
    [Key.Return, 'enter'],
    [Key.Comma, ','],
    [Key.Period, '.'],
    [Key.Slash, '/'],

    [Key.Left, 'left'],
    [Key.Up, 'up'],
    [Key.Right, 'right'],
    [Key.Down, 'down'],

    [Key.Print, 'printscreen'],
    [Key.Pause, null],
    [Key.Insert, 'insert'],
    [Key.Delete, null],
    [Key.Home, 'home'],
    [Key.End, 'end'],
    [Key.PageUp, 'pageup'],
    [Key.PageDown, 'pagedown'],

    [Key.Add, null],
    [Key.Subtract, null],
    [Key.Multiply, null],
    [Key.Divide, null],
    [Key.Decimal, null],
    [Key.Enter, 'enter'],

    [Key.CapsLock, null],
    [Key.ScrollLock, null],
    [Key.NumLock, null],
  ]);

  // robot: any;
  infoWindow: BrowserWindow;

  constructor(
    private electronService: ElectronService,
    private ngxService: NgxService
  ) {
    window.test = this.KeyLookupMap;
    // this.robot = this.ngxService.remote?.require('robotjs');
    // this.robot?.setMouseDelay(0);
    // this.robot?.setKeyboardDelay(0);
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
      b: +textArray[3] || 0,
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
        this.electronService.nutJs.mouse.pressButton(data.b);
        break;
      }
      case 'mu': {
        this.electronService.nutJs.mouse.releaseButton(data.b);
        break;
      }
      case 'mm': {
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
    console.log('Data', data);
    const nut = this.electronService.nutJs;
    const k = data.key;
    const modifiers = [];
    if (data.shift) modifiers.push(nut.Key.LeftShift);

    if (data.control)
      modifiers.push(
        process.platform === 'darwin' ? nut.Key.LeftSuper : nut.Key.LeftControl
      );
    if (data.alt) modifiers.push(nut.Key.LeftAlt);
    if (data.meta) modifiers.push(nut.Key.Home);
    if (k === 'Enter') nut.keyboard.type(nut.Key.Enter);
    else if (k === 'Backspace') nut.keyboard.type(nut.Key.Backspace);
    else if (k === 'ArrowUp') nut.keyboard.type(nut.Key.Up);
    else if (k === 'ArrowDown') nut.keyboard.type(nut.Key.Down);
    else if (k === 'ArrowLeft') nut.keyboard.type(nut.Key.Left);
    else if (k === 'ArrowRight') nut.keyboard.type(nut.Key.Right);
    else if (k === 'Escape') nut.keyboard.type(nut.Key.Escape);
    else if (k === '<delete>') nut.keyboard.type(nut.Key.Delete);
    else if (k === 'Meta') nut.keyboard.type(nut.Key.Home);
    else if (k === '<end>') nut.keyboard.type(nut.Key.End);
    else if (k === 'PageUp') nut.keyboard.type(nut.Key.PageUp);
    else if (k === 'PageDown') nut.keyboard.type(nut.Key.PageDown);
    else if (k === '?') nut.keyboard.type('?');
    else {
      if (modifiers[0]) {
        const id = [...this.KeyLookupMap.entries()]
          .filter(({ 1: v }) => v === k.toLowerCase())
          .map(([d]) => d);
        nut.keyboard.pressKey(modifiers[0]);
        nut.keyboard.pressKey(id[0]);
        nut.keyboard.releaseKey(modifiers[0]);
        nut.keyboard.releaseKey(id[0]);
      } else {
        nut.keyboard.type(k);
        console.log(k);
      }
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
          } as any,
        });

        this.electronService.remote
          .require('@electron/remote/main')
          .enable(this.infoWindow.webContents);

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
