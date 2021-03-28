import { app, BrowserWindow, Menu, nativeImage, screen, Tray } from 'electron';
import * as path from 'path';
import * as url from 'url';

// Initialize remote module
require('@electron/remote/main').initialize();

let hidden, tray;

let win: BrowserWindow = null;
const gotTheLock = app.requestSingleInstanceLock();

const args = process.argv.slice(1),
  serve = args.some((val) => val === '--serve');

function createWindow(): BrowserWindow {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    width: 400,
    height: size.height / 1.5,
    icon: path.join(__dirname, 'data/icon-white.png'),
    show: !hidden,
    titleBarStyle: 'hidden',
    frame: true,
    center: true,
    backgroundColor: '#2e2c29',
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve ? true : false,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  const iconPath = path.join(__dirname, 'data/icon-white.png');
  tray = new Tray(nativeImage.createFromPath(iconPath));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Öffnen',
      click: () => {
        win.show();
      },
    },
    {
      label: 'Schließen',
      click: () => {
        win.close();
      },
    },
  ]);
  tray.setToolTip('RemoteControl');
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
    win.webContents.openDevTools();
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

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
        // if (win.isMinimized()) win.restore();
      }
    });

    // Create myWindow, load the rest of the app, etc...
    app.on('ready', createWindow);
  }

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  // Catch Error
  // throw e;
}
