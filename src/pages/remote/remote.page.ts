import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import SimplePeer from 'simple-peer';
import SimplePeerFiles from 'simple-peer-files';
import { SocketService } from '../../app/core/services/socket.service';
import { TauriService } from '../../app/core/services/tauri.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-remote',
  template: `
    <div class="h-screen w-screen bg-black flex flex-col overflow-hidden">
      <!-- Toolbar -->
      <div
        class="toolbar absolute top-0 left-0 right-0 z-10 bg-dark-900/90 backdrop-blur-sm transition-transform duration-300"
        [class.-translate-y-full]="toolbarHidden"
        (mouseenter)="showToolbar()"
        (mouseleave)="hideToolbar()">
        <div class="flex items-center justify-between px-4 py-2">
          <div class="flex items-center space-x-4">
            <span class="text-sm text-dark-300">{{ 'Connected to' | translate }}: {{ partnerId }}</span>
            <span class="badge-success" *ngIf="connected">{{ 'Connected' | translate }}</span>
            <span class="badge-warning" *ngIf="!connected">{{ 'Connecting...' | translate }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <button
              (click)="toggleFullscreen()"
              class="btn-ghost btn-sm"
              title="Fullscreen">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
              </svg>
            </button>
            <button
              (click)="disconnect()"
              class="btn-danger btn-sm">
              {{ 'Disconnect' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Toolbar trigger area -->
      <div
        class="absolute top-0 left-0 right-0 h-2 z-20"
        (mouseenter)="showToolbar()">
      </div>

      <!-- Video container -->
      <div
        class="flex-1 flex items-center justify-center"
        #videoContainer
        (mousedown)="onMouseDown($event)"
        (mouseup)="onMouseUp($event)"
        (mousemove)="onMouseMove($event)"
        (wheel)="onWheel($event)"
        (contextmenu)="onContextMenu($event)"
        (dblclick)="onDoubleClick($event)"
        (dragover)="onDragOver($event)"
        (drop)="onDrop($event)">

        <video
          #videoElement
          autoplay
          playsinline
          muted
          class="max-w-full max-h-full"
          [style.cursor]="connected ? 'none' : 'default'">
        </video>

        <!-- Loading indicator -->
        <div
          *ngIf="!connected"
          class="absolute inset-0 flex items-center justify-center bg-dark-900/80">
          <div class="text-center">
            <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-dark-300">{{ 'Connecting to partner...' | translate }}</p>
          </div>
        </div>
      </div>

      <!-- Password dialog -->
      <div
        *ngIf="showPasswordDialog"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="card max-w-sm w-full mx-4 animate-slide-in">
          <h3 class="text-lg font-semibold mb-4">{{ 'Password Required' | translate }}</h3>
          <input
            type="password"
            [(ngModel)]="password"
            class="input mb-4"
            placeholder="Enter password"
            (keydown.enter)="submitPassword()">
          <div class="flex space-x-3">
            <button (click)="cancelPassword()" class="btn-secondary flex-1">
              {{ 'Cancel' | translate }}
            </button>
            <button (click)="submitPassword()" class="btn-primary flex-1">
              {{ 'Submit' | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    video {
      object-fit: contain;
    }
  `]
})
export class RemotePage implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoContainer') videoContainer!: ElementRef<HTMLDivElement>;

  partnerId = '';
  connected = false;
  toolbarHidden = true;
  showPasswordDialog = false;
  password = '';

  private peer: SimplePeer.Instance | null = null;
  private spf: any;
  private socketSub: Subscription | null = null;
  private remoteWidth = 1920;
  private remoteHeight = 1080;
  private toolbarTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private socketService: SocketService,
    private tauriService: TauriService
  ) {
    this.spf = new SimplePeerFiles();
  }

  ngOnInit(): void {
    this.partnerId = this.route.snapshot.paramMap.get('id') ||
                     this.route.snapshot.queryParamMap.get('id') || '';

    if (this.partnerId) {
      this.initConnection();
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.connected) return;

    event.preventDefault();

    const keyData = {
      key: event.key,
      code: event.code,
      shift: event.shiftKey,
      control: event.ctrlKey,
      alt: event.altKey,
      meta: event.metaKey,
    };

    this.peer?.send(JSON.stringify(keyData));
  }

  private initConnection(): void {
    this.socketService.init();
    this.socketService.joinRoom(this.partnerId);
    this.socketService.sendMessage('hi');

    this.socketSub = this.socketService.onNewMessage().subscribe((data: any) => {
      this.handleSocketMessage(data);
    });
  }

  private handleSocketMessage(data: any): void {
    if (typeof data === 'string') {
      if (data.startsWith('screenSize')) {
        const parts = data.split(',');
        this.remoteWidth = parseInt(parts[1], 10);
        this.remoteHeight = parseInt(parts[2], 10);
      } else if (data === 'pwRequest') {
        this.showPasswordDialog = true;
      } else if (data === 'pwWrong') {
        this.showPasswordDialog = true;
        this.password = '';
        alert('Password incorrect');
      } else if (data === 'decline') {
        this.disconnect();
        window.close();
      }
    } else {
      // WebRTC signaling
      if (!this.peer) {
        this.createPeer();
      }
      this.peer?.signal(data);
    }
  }

  private createPeer(): void {
    this.peer = new SimplePeer({
      initiator: false,
      config: {
        iceServers: [
          { urls: ['stun:turn.codext.de', 'stun:stun.nextcloud.com:443'] },
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

    this.peer.on('stream', (stream) => {
      this.connected = true;
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = stream;
      }
    });

    this.peer.on('data', (data) => {
      const text = new TextDecoder().decode(data);
      if (text.startsWith('start-')) {
        const fileId = text.substring(6);
        const transfer = this.spf.send(this.peer, fileId, (this as any).pendingFile);
        transfer.on('progress', (p: number) => console.log('Upload progress:', p));
        transfer.start();
      }
    });

    this.peer.on('error', (err) => {
      console.error('Peer error:', err);
      this.connected = false;
    });

    this.peer.on('close', () => {
      this.connected = false;
    });
  }

  submitPassword(): void {
    if (this.password) {
      this.socketService.sendMessage(`pwAnswer-${this.password}`);
      this.showPasswordDialog = false;
    }
  }

  cancelPassword(): void {
    this.showPasswordDialog = false;
    this.disconnect();
    window.close();
  }

  disconnect(): void {
    this.peer?.destroy();
    this.peer = null;
    this.socketService.destroy();
    this.socketSub?.unsubscribe();
    this.connected = false;
  }

  showToolbar(): void {
    this.toolbarHidden = false;
    clearTimeout(this.toolbarTimeout);
  }

  hideToolbar(): void {
    this.toolbarTimeout = setTimeout(() => {
      this.toolbarHidden = true;
    }, 2000);
  }

  toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  private getScaledCoordinates(event: MouseEvent): { x: number; y: number } {
    const video = this.videoElement?.nativeElement;
    if (!video) return { x: 0, y: 0 };

    const rect = video.getBoundingClientRect();
    const scaleX = this.remoteWidth / rect.width;
    const scaleY = this.remoteHeight / rect.height;

    return {
      x: Math.round((event.clientX - rect.left) * scaleX),
      y: Math.round((event.clientY - rect.top) * scaleY),
    };
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.connected) return;
    const { x, y } = this.getScaledCoordinates(event);
    this.peer?.send(`mm,${x},${y}`);
  }

  onMouseDown(event: MouseEvent): void {
    if (!this.connected) return;
    const { x, y } = this.getScaledCoordinates(event);
    this.peer?.send(`md,${x},${y},${event.button}`);
  }

  onMouseUp(event: MouseEvent): void {
    if (!this.connected) return;
    const { x, y } = this.getScaledCoordinates(event);
    this.peer?.send(`mu,${x},${y},${event.button}`);
  }

  onDoubleClick(event: MouseEvent): void {
    if (!this.connected) return;
    const { x, y } = this.getScaledCoordinates(event);
    this.peer?.send(`dc,${x},${y},${event.button}`);
  }

  onWheel(event: WheelEvent): void {
    if (!this.connected) return;
    event.preventDefault();
    const direction = event.deltaY < 0 ? 'up' : 'down';
    this.peer?.send(`s,${direction}`);
  }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (!this.connected) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      (this as any).pendingFile = file;
      const fileId = `${Date.now()}-${file.name}`;
      this.peer?.send(`file-${fileId}`);
    }
  }
}
