import { Injectable, NgZone } from '@angular/core';
import { Subject, Subscription, BehaviorSubject } from 'rxjs';
import SimplePeer from 'simple-peer';
import SimplePeerFiles from 'simple-peer-files';
import { environment } from '../../../environments/environment';
import { ConnectHelperService } from './connect-helper.service';
import { FrameStreamService } from './frame-stream.service';
import { SocketService } from './socket.service';
import { TauriService, ScreenInfo } from './tauri.service';
import { SettingsService } from './settings.service';

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  partnerId?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConnectService {
  private peer: SimplePeer.Instance | null = null;
  private spf: any;
  private socketSub: Subscription | null = null;
  private disconnectSub: Subscription | null = null;
  private clipboardUnlisten: (() => void) | null = null;

  private initialized = false;
  private selectedScreen: ScreenInfo | null = null;

  public id = '';
  public idArray: string[] = [];
  public remoteIdArray: Array<{ number?: number }> = [{}, {}, {}, {}, {}, {}, {}, {}, {}];
  public connected = false;
  public fileLoading = false;

  // Observable state
  private connectionState$ = new BehaviorSubject<ConnectionState>({ status: 'disconnected' });
  private permissionRequest$ = new Subject<{ resolve: (value: boolean) => void }>();

  constructor(
    private tauriService: TauriService,
    private socketService: SocketService,
    private connectHelperService: ConnectHelperService,
    private frameStreamService: FrameStreamService,
    private settingsService: SettingsService,
    private ngZone: NgZone
  ) {
    this.spf = new SimplePeerFiles();
  }

  getConnectionState() {
    return this.connectionState$.asObservable();
  }

  getPermissionRequest() {
    return this.permissionRequest$.asObservable();
  }

  setSelectedScreen(screen: ScreenInfo): void {
    this.selectedScreen = screen;
  }

  getSelectedScreen(): ScreenInfo | null {
    return this.selectedScreen;
  }

  setRemoteId(id: string): void {
    if (id.length === 9) {
      const idArray = id.split('').map(char => parseInt(char, 10));
      idArray.forEach((number, index) => {
        this.remoteIdArray[index] = { number };
      });
    }
  }

  async sendScreenSize(): Promise<void> {
    if (!this.selectedScreen) {
      const screens = await this.tauriService.getScreens();
      this.selectedScreen = screens.find(s => s.is_primary) || screens[0];
    }

    if (this.selectedScreen) {
      const { width, height, scale_factor } = this.selectedScreen;
      const scaledWidth = Math.round(width * scale_factor);
      const scaledHeight = Math.round(height * scale_factor);
      this.socketService.sendMessage(`screenSize,${scaledWidth},${scaledHeight}`);
      console.log('Sent screen size:', scaledWidth, 'x', scaledHeight);
    }
  }

  async askForConnectPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      this.permissionRequest$.next({ resolve });
    });
  }

  async generateId(): Promise<void> {
    const settings = await this.settingsService.getSettings();

    try {
      this.id = await this.tauriService.generateConnectionId(!settings.randomId);
    } catch (error) {
      // Fallback to random ID
      this.id = `${this.connectHelperService.threeDigit()}${this.connectHelperService.threeDigit()}${this.connectHelperService.threeDigit()}`;
    }

    this.idArray = this.id.split('');
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.connectionState$.next({ status: 'connecting' });

    await this.generateId();

    // Initialize socket connection
    this.socketService.init();
    this.socketService.joinRoom(this.id);

    // Start clipboard watching
    await this.startClipboardWatch();

    // Handle disconnection
    this.disconnectSub = this.socketService.onDisconnected().subscribe(() => {
      this.ngZone.run(() => {
        this.connectionState$.next({ status: 'disconnected', message: 'Connection was terminated' });
        this.reconnect();
      });
    });

    // Handle incoming messages
    this.socketSub = this.socketService.onNewMessage().subscribe(async (data: any) => {
      await this.handleSocketMessage(data);
    });

    this.connectionState$.next({ status: 'disconnected' });
  }

  private async handleSocketMessage(data: any): Promise<void> {
    console.log('Received message:', typeof data === 'string' ? data.substring(0, 50) : data);

    if (typeof data === 'string') {
      if (data === 'hi') {
        await this.sendScreenSize();

        const settings = await this.settingsService.getSettings();
        if (settings.hiddenAccess) {
          this.socketService.sendMessage('pwRequest');
          return;
        }

        // Show main window and ask for permission
        await this.tauriService.show();
        await this.tauriService.focus();

        const result = await this.askForConnectPermission();
        if (!result) {
          this.socketService.sendMessage('decline');
          return;
        }

        await this.startVideoConnection();
      } else if (data.startsWith('pwAnswer')) {
        const pw = data.substring(9);
        const settings = await this.settingsService.getSettings();

        if (settings.passwordHash) {
          const isCorrect = await this.tauriService.verifyPassword(pw, settings.passwordHash);

          if (isCorrect) {
            await this.startVideoConnection();
          } else {
            this.socketService.sendMessage('pwWrong');
          }
        }
      } else if (data.startsWith('decline')) {
        this.connectionState$.next({ status: 'disconnected', message: 'Connection declined' });
      }
    } else if (this.peer) {
      // WebRTC signaling data
      this.peer.signal(data);
    }
  }

  private async startClipboardWatch(): Promise<void> {
    try {
      await this.tauriService.startClipboardWatch();
      this.clipboardUnlisten = this.tauriService.onClipboardChange((content) => {
        if (content.text && this.peer && this.connected) {
          this.peer.send(`clipboard-${content.text}`);
        }
      });
    } catch (error) {
      console.error('Failed to start clipboard watch:', error);
    }
  }

  private async startVideoConnection(): Promise<void> {
    if (!this.selectedScreen) {
      const screens = await this.tauriService.getScreens();
      this.selectedScreen = screens.find(s => s.is_primary) || screens[0];
    }

    if (!this.selectedScreen) {
      console.error('No screen available for capture');
      return;
    }

    this.connectionState$.next({ status: 'connecting' });

    try {
      // Start frame capture and get MediaStream
      const stream = await this.frameStreamService.startCapture(
        this.selectedScreen.id,
        this.selectedScreen.width,
        this.selectedScreen.height,
        30
      );

      // Create WebRTC peer connection
      this.peer = new SimplePeer({
        initiator: true,
        stream: stream,
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

      this.peer.on('signal', (data) => {
        this.socketService.sendMessage(data);
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        this.reconnect();
      });

      this.peer.on('close', () => {
        console.log('Peer connection closed');
        this.reconnect();
      });

      this.peer.on('connect', async () => {
        console.log('Peer connected');
        this.connected = true;
        this.connectionState$.next({ status: 'connected' });
        await this.connectHelperService.showInfoWindow();
        await this.tauriService.minimize();
      });

      this.peer.on('data', async (data) => {
        await this.handlePeerData(data);
      });

    } catch (error) {
      console.error('Failed to start video connection:', error);
      this.connectionState$.next({ status: 'error', message: 'Failed to start screen capture' });
    }
  }

  private async handlePeerData(data: Uint8Array | ArrayBuffer): Promise<void> {
    try {
      const text = new TextDecoder('utf-8').decode(data);

      // File transfer
      if (text.startsWith('file-')) {
        const fileId = text.substring(5);
        this.spf.receive(this.peer, fileId).then((transfer: any) => {
          this.fileLoading = true;
          transfer.on('progress', (p: number) => console.log('File progress:', p));
          transfer.on('done', (file: File) => {
            this.fileLoading = false;
            const element = document.createElement('a');
            element.href = URL.createObjectURL(file);
            element.download = file.name;
            element.click();
          });
        });
        this.peer?.send(`start-${fileId}`);
        return;
      }

      // Clipboard
      if (text.startsWith('clipboard-')) {
        const clipboardText = text.substring(10);
        await this.connectHelperService.handleClipboard(clipboardText);
        return;
      }

      // Key event (JSON)
      if (text.startsWith('{')) {
        const keyData = JSON.parse(text);
        await this.connectHelperService.handleKey(keyData);
        return;
      }

      // Scroll event
      if (text.startsWith('s')) {
        await this.connectHelperService.handleScroll(text);
        return;
      }

      // Mouse event
      await this.connectHelperService.handleMouse(text);
    } catch (error) {
      // Silently handle parse errors
    }
  }

  async reconnect(): Promise<void> {
    await this.tauriService.show();
    this.connected = false;
    this.connectionState$.next({ status: 'disconnected' });
    await this.destroy();

    setTimeout(() => {
      this.init();
    }, 500);

    await this.connectHelperService.closeInfoWindow();
  }

  async destroy(): Promise<void> {
    this.initialized = false;

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    await this.frameStreamService.stopCapture();

    if (this.clipboardUnlisten) {
      this.clipboardUnlisten();
      this.clipboardUnlisten = null;
    }

    await this.tauriService.stopClipboardWatch();

    this.socketService.destroy();
    this.socketSub?.unsubscribe();
    this.disconnectSub?.unsubscribe();
  }

  async connect(id: string): Promise<void> {
    try {
      await this.tauriService.createRemoteWindow(id);
    } catch (error) {
      console.error('Failed to create remote window:', error);
    }
  }
}
