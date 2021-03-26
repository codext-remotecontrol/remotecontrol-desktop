import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
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
    private appService: AppService
  ) {}

  ngOnInit() {
    this.appService.sideMenu = false;
    this.peer2 = new SimplePeer({
      channelName: 'danieltester1235',
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

      video.addEventListener('mousemove', this.mousemoveListener.bind(this));

      video.addEventListener(
        'loadeddata',
        () => {
          this.videoSize = video.getBoundingClientRect();
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

    this.socketService.onNewMessage().subscribe((data: any) => {
      this.peer2.signal(data);
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
      this.mousemoveListener.bind(this)
    );
  }

  mouseListener(event: MouseEvent) {
    // event.preventDefault();
    console.log(event);
    let type;
    if (event.type == 'mouseup') {
      type = 'mu';
    } else if (event.type == 'mousedown') {
      type = 'md';
    } else if (event.type == 'dblclick') {
      type = 'dc';
    }

    const data = {
      t: type,
      x: event.offsetX,
      y: event.offsetY,
      w: this.videoSize.width,
      h: this.videoSize.height,
      b: event.button,
    };
    // this.socketService.sendMessage(data, 'remoteData');
    const jsonString = stringify(data);
    this.peer2.send(jsonString);
  }

  mousemoveListener(event) {
    // console.log('mousemoveListener', event);
    const data = {
      t: 'mm',
      x: event.offsetX,
      y: event.offsetY,
      w: this.videoSize.width,
      h: this.videoSize.height,
    };

    const jsonString = stringify(data);
    console.log('jsonString', jsonString);
  }
  keydownListener(event: KeyboardEvent) {
    // console.log(event);
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
    // this.socketService.sendMessage(data, 'remoteData');
    const jsonString = stringify(data);
    this.peer2.send(jsonString);
  }

  scrollListener(event: any) {
    const data = {
      type: 'scroll',
    };
    this.socketService.sendMessage(data, 'remoteData');
  }
}
