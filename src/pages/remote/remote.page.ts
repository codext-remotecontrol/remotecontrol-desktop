import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AnimationOptions } from 'ngx-lottie';
import SimplePeer from 'simple-peer';
import 'webrtc-adapter';
import { SocketService } from '../../app/core/services/socket.service';
import { AppService } from './../../app/core/services/app.service';
import { ElectronService } from './../../app/core/services/electron/electron.service';

@Component({
  template: `
    <div mat-dialog-title>Passwort eingeben</div>
    <div mat-dialog-content>
      <mat-form-field>
        <mat-label>{{ 'Password' | translate }}</mat-label>
        <input matInput [(ngModel)]="pw" type="password" />
      </mat-form-field>
    </div>
    <div
      mat-dialog-actions
      style="
    flex-wrap: nowrap;"
    >
      <button mat-button (click)="cancel()">{{ 'Cancel' | translate }}</button>
      <button mat-button cdkFocusInitial (click)="connect()">
        {{ 'Connect' | translate }}
      </button>
    </div>
  `,
})
export class PwDialog {
  pw = '';
  constructor(
    public dialogRef: MatDialogRef<PwDialog>,
    private translateService: TranslateService
  ) {}

  connect() {
    this.dialogRef.close(this.pw);
  }

  cancel() {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-remote',
  templateUrl: './remote.page.html',
  styleUrls: ['./remote.page.scss'],
})
export class RemotePage implements OnInit, OnDestroy {
  signalData = '';
  peer2;
  userId = 'browser';
  video: HTMLVideoElement;
  stream: any;
  videoSize;
  hostScreenSize;

  connected = false;

  options: AnimationOptions | any = {
    path: '/assets/animations/lf30_editor_PsHnfk.json',
    loop: true,
  };

  @HostListener('contextmenu', ['$event'])
  oncontextmenu(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.connected) {
      console.log('event', event);
      event.preventDefault();
      event.stopPropagation();
      this.keydownListener(event);
    }
  }

  @HostListener('mousewheel', ['$event'])
  onScroll(event: WheelEvent) {
    if (this.connected) {
      event.preventDefault();
      event.stopPropagation();
      this.scrollListener(event);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.calcVideoSize();
  }

  constructor(
    private socketService: SocketService,
    private elementRef: ElementRef,
    private appService: AppService,
    private route: ActivatedRoute,
    private electronService: ElectronService,
    private dialog: MatDialog
  ) {}

  pwPrompt() {
    return new Promise<string>((resolve, reject) => {
      const dialogRef = this.dialog.open(PwDialog, {
        width: '250px',
      });

      dialogRef.afterClosed().subscribe((result) => {
        resolve(result);
      });
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.queryParams.id;
    console.log('id', id);

    this.socketService.joinRoom(id);
    this.socketService.sendMessage('hi');
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.socketService.onNewMessage().subscribe(async (data: any) => {
      if (typeof data == 'string' && data?.startsWith('screenSize')) {
        const size = data.split(',');
        this.hostScreenSize = {
          height: +size[2],
          width: +size[1],
        };
      } else if (typeof data == 'string' && data?.startsWith('pwRequest')) {
        const pw: string = await this.pwPrompt();
        if (pw) {
          this.socketService.sendMessage(`pwAnswer:${pw}`);
        } else {
          this.socketService.sendMessage('decline');
          this.close();
        }
      } else if (typeof data == 'string' && data?.startsWith('decline')) {
        this.close();
      } else {
        this.peer2.signal(data);
      }
    });

    this.appService.sideMenu = false;
    this.peer2 = new SimplePeer({
      channelName: id,
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

    this.peer2.on('signal', (data) => {
      this.socketService.sendMessage(data);
    });

    this.peer2.on('stream', (stream) => {
      this.connected = true;
      const video: HTMLVideoElement = this.elementRef.nativeElement.querySelector(
        'video'
      );
      this.video = video;
      this.stream = stream;
      video.srcObject = stream;
      video.play();

      video.addEventListener('mousedown', this.mouseListener.bind(this));
      video.addEventListener('mouseup', this.mouseListener.bind(this));
      video.addEventListener('dblclick', this.mouseListener.bind(this));
      video.addEventListener('mousemove', this.mouseMoveListener.bind(this));
      video.addEventListener(
        'resize',
        (ev) => {
          const w = video.videoWidth;
          const h = video.videoHeight;

          if (w && h) {
            video.style.width = w.toString();
            video.style.height = h.toString();
          }
          console.log(w, h);
        },
        false
      );

      video.addEventListener(
        'loadeddata',
        () => {
          this.calcVideoSize();
        },
        false
      );
    });

    this.peer2.on('close', () => {
      console.log('close');
      this.close();
    });
    this.peer2.on('error', () => {
      console.log('error');
      this.close();
    });
  }

  close() {
    this.connected = false;
    this.removeEventListeners();
    const BrowserWindow = this.electronService.remote.BrowserWindow;
    const currentWindow = BrowserWindow.getAllWindows().filter((b) => {
      return b.isFocused();
    });
    currentWindow[0]?.close();
  }

  calcVideoSize() {
    this.videoSize = this.video?.getBoundingClientRect();
    // const height = this.stream?.getVideoTracks()[0].getSettings().height;
    // const width = this.stream?.getVideoTracks()[0].getSettings().width;

    /*this.hostScreenSize = {
      height: 1080,
      width: 1920,
    };*/
    console.log('this.hostScreenSize', this.hostScreenSize, this.videoSize);
  }

  ngOnDestroy() {
    this.appService.sideMenu = true;
    this.removeEventListeners();
  }

  removeEventListeners() {
    this.video?.removeEventListener('mousedown', this.mouseListener.bind(this));
    this.video?.removeEventListener('mouseup', this.mouseListener.bind(this));
    this.video?.removeEventListener('dblclick', this.mouseListener.bind(this));
    this.video?.removeEventListener(
      'mousemove',
      this.mouseMoveListener.bind(this)
    );
  }

  mouseListener(event: MouseEvent) {
    if (!this.connected) {
      return;
    }
    let type: string;
    if (event.type == 'mouseup') {
      type = 'mu';
    } else if (event.type == 'mousedown') {
      type = 'md';
    } else if (event.type == 'dblclick') {
      type = 'dc';
    }
    const x = this.scale(
      event.offsetX,
      0,
      this.videoSize?.width,
      0,
      this.hostScreenSize?.width
    );

    const y = this.scale(
      event.offsetY,
      0,
      this.videoSize?.height,
      0,
      this.hostScreenSize?.height
    );

    const stringData = `${type},${x},${y},${event.button}`;
    this.peer2.send(stringData);
  }

  mouseMoveListener(event) {
    if (!this.connected) {
      return;
    }
    const x = this.scale(
      event?.offsetX,
      0,
      this.videoSize?.width,
      0,
      this.hostScreenSize?.width
    );
    const y = this.scale(
      event?.offsetY,
      0,
      this.videoSize?.height,
      0,
      this.hostScreenSize?.height
    );
    const stringData = `mm,${x},${y}`;
    this.peer2.send(stringData);
  }
  keydownListener(event: KeyboardEvent) {
    if (!this.connected) {
      return;
    }
    const data = {
      t: 'k',
      code: event.code,
      keyCode: event.keyCode,
      key: event.key,
      shift: event.shiftKey,
      control: event.ctrlKey,
      alt: event.altKey,
      meta: event.metaKey,
    };
    this.peer2.send(JSON.stringify(data));
  }

  scrollListener(event: WheelEvent) {
    if (!this.connected) {
      return;
    }
    let stringData;
    if (event.deltaY < 0) {
      stringData = `s,up`;
    } else if (event.deltaY > 0) {
      stringData = `s,down`;
    }
    this.peer2.send(stringData);
  }

  scale(x, fromLow, fromHigh, toLow, toHigh) {
    return Math.trunc(
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      ((x - fromLow) * (toHigh - toLow)) / (fromHigh - fromLow) + toLow
    );
  }
}
