/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/restrict-plus-operands */

import {
  app,
  dialog,
  Menu,
  nativeImage,
  Tray,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  MessageBoxOptions,
} from 'electron';

import { autoUpdater } from 'electron-updater';

import * as path from 'path';
import * as url from 'url';
require('@electron/remote/main').initialize();

ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', (event, opts) =>
  desktopCapturer.getSources(opts)
);

let type: string;
if (process.platform === 'win32') {
  type = 'win';
}
if (process.platform === 'darwin') {
  type = 'macos';
}
if (process.platform === 'linux') {
  type = 'linux';
}

autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'codext-remotecontrol',
    repo: 'remotecontrol-desktop',
    private: false,
    releaseType: 'release',
});
autoUpdater.autoDownload = true;

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message =
    log_message +
    ' (' +
    progressObj.transferred +
    '/' +
    progressObj.total +
    ')';
});
autoUpdater.on('update-downloaded', (event) => {
  const dialogOpts: MessageBoxOptions = {
    type: 'info',
    buttons: ['Neustart', 'Später'],
    title: 'Anwendungsaktualisierung',
    message: "releaseNotes",
    detail:
      'Eine neue Version wurde heruntergeladen. Starten Sie die Anwendung neu, um die Updates anzuwenden.',
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
  });
});

let hidden, tray, serve;

let win: Electron.BrowserWindow | any = null;
const gotTheLock = app.requestSingleInstanceLock();

const args = process.argv.slice(1);
serve = args.some((val) => val === '--serve');
hidden = args.some((val) => val === '--hidden');

// eslint-disable-next-line @typescript-eslint/require-await
async function createWindow(): Promise<Electron.BrowserWindow> {
  autoUpdater.checkForUpdates();
  app.setAppUserModelId('de.codext.remotedesktop-control');
  //  app.allowRendererProcessReuse = false;

  // Create the browser window.
  win = new BrowserWindow({
    width: 410,
    minWidth: 250,
    minHeight: 250,
    height: 600,
    icon: path.join(__dirname, 'data/icon.png'),
    show: !hidden,
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    frame: process.platform === 'darwin' ? true : false,
    center: true,
    backgroundColor: '#252a33',
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve ? true : false,
      contextIsolation: false,
      enableRemoteModule: true,
      // enableRemoteModule: true,
    } as any,
  });

  require('@electron/remote/main').enable(win.webContents);
  /*const isMac = process.platform === 'darwin';
  const template = [
    { id: '1', label: 'one' },
    { id: '2', label: 'two' },
    { id: '3', label: 'three' },
    { id: '4', label: 'four' },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
*/
  const iconPath = path.join(__dirname, 'data/icon-no-bg-small.png');

  tray = new Tray(nativeImage.createFromPath(iconPath));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open",
      click: () => {
        win?.show();
      },
    },
    {
      label: "Dev Tools",
      click: () => {
        win?.webContents.openDevTools();
      },
    },
    {
      label: "Close",
      click: () => {
        win?.close();
        app?.quit();
      },
    },
  ]);
  tray.setToolTip('Remotecontrol Desktop');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    win.show();
  });

  if (serve) {
    win.webContents.openDevTools();
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
    win.loadURL('http://localhost:4200/#/home');
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  // win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  /*win.on('close', (e) => {
    e.preventDefault();
    win.destroy();
  });*/

  return win;
}

try {
  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (win) {
        win.show();
        win.focus();
        // win.restore();
        // if (win.isMinimized()) win.restore();
      }
    });

    // Create myWindow, load the rest of the app, etc...
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    app.on('ready', async () => {
      await createWindow();
    });
  }

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  console.log('e', e);
  // Catch Error
  // throw e;
}
