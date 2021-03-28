import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import SimplePeer from 'simple-peer';
import 'webrtc-adapter';
import { stringify } from 'zipson';
import { SocketService } from '../../app/core/services/socket.service';
import { AppService } from './../../app/core/services/app.service';
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
  videoSize;
  hostScreenSize;

  @HostListener('contextmenu', ['$event'])
  oncontextmenu(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.keydownListener(event);
  }

  @HostListener('document:scroll', ['$event'])
  onScroll(event) {
    this.scrollListener(event);
  }

  constructor(
    private socketService: SocketService,
    private elementRef: ElementRef,
    private appService: AppService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.queryParams.id;
    console.log('id', id);
    this.socketService.joinRoom(id);
    this.socketService.onNewMessage().subscribe((data: any) => {
      // console.log('tester');
      this.peer2.signal(data);
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
      const video: HTMLVideoElement = this.elementRef.nativeElement.querySelector(
        'video'
      );
      this.video = video;
      video.srcObject = stream;
      video.play();

      video.addEventListener('mousedown', this.mouseListener.bind(this));
      video.addEventListener('mouseup', this.mouseListener.bind(this));
      video.addEventListener('dblclick', this.mouseListener.bind(this));
      video.addEventListener('mousemove', this.mouseMoveListener.bind(this));

      video.addEventListener(
        'loadeddata',
        () => {
          console.log(this.video);
          this.videoSize = video.getBoundingClientRect();
          const height = stream.getVideoTracks()[0].getSettings().height;
          const width = stream.getVideoTracks()[0].getSettings().width;
          this.hostScreenSize = {
            height,
            width,
          };

          console.log(height, width);
        },
        false
      );
    });

    this.peer2.on('close', () => {
      this.removeEventListeners();
    });
    this.peer2.on('error', () => {
      this.removeEventListeners();
    });
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
      this.videoSize.width,
      0,
      this.hostScreenSize.width
    );

    const y = this.scale(
      event.offsetY,
      0,
      this.videoSize.height,
      0,
      this.hostScreenSize.height
    );

    const data = {
      t: type,
      x,
      y,
      b: event.button,
    };
    const stringData = `${type},${x},${y},${event.button}`;
    this.peer2.send(stringData);
  }

  mouseMoveListener(event) {
    const x = this.scale(
      event?.offsetX,
      0,
      this.videoSize?.width,
      0,
      this.hostScreenSize.width
    );
    const y = this.scale(
      event?.offsetY,
      0,
      this.videoSize?.height,
      0,
      this.hostScreenSize.height
    );
    const stringData = `mm,${x},${y}`;
    this.peer2.send(stringData);
  }
  keydownListener(event: KeyboardEvent) {
    const data = {
      t: 'k',
      code: event.code,
      keyCode: event.keyCode,
      // key: event.key,
      shift: event.shiftKey,
      control: event.ctrlKey,
      alt: event.altKey,
      meta: event.metaKey,
    };
    this.peer2.send(JSON.stringify(data));
  }

  scrollListener(event: any) {
    const data = {
      type: 'scroll',
    };
    this.socketService.sendMessage(data, 'remoteData');
  }

  scale(x, fromLow, fromHigh, toLow, toHigh) {
    return Math.trunc(
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      ((x - fromLow) * (toHigh - toLow)) / (fromHigh - fromLow) + toLow
    );
  }
}