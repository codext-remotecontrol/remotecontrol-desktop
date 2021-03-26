import { AppService } from './../../app/core/services/app.service';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import SimplePeer from 'simple-peer';
import { SocketService } from '../../app/core/services/socket.service';
import 'webrtc-adapter';

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

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.keydownListener(event);
  }

  constructor(
    private socketService: SocketService,
    private elementRef: ElementRef,
    private appService: AppService
  ) {}

  ngOnInit() {
    this.appService.sideMenu = false;
    this.peer2 = new SimplePeer({
      channelName: 'danieltester123',
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
      video.addEventListener('mouseup', this.mouseupListener.bind(this));
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
    this.video?.removeEventListener('mouseup', this.mouseupListener.bind(this));
  }

  mouseupListener(event: MouseEvent) {
    console.log(event);
    const videoSize = this.video.getBoundingClientRect();

    const data = {
      type: 'mouse',
      clientX: event.offsetX,
      clientY: event.offsetY,
      canvasWidth: videoSize.width,
      canvasHeight: videoSize.height,
    };
    this.socketService.sendMessage(data, 'remoteData');
  }
  keydownListener(event: KeyboardEvent) {
    console.log(event);
    const data = {
      type: 'key',
      code: event.code,
      keyCode: event.keyCode,
      key: event.key,

      shift: event.shiftKey,
      control: event.ctrlKey,
      alt: event.altKey,
      meta: event.metaKey,
    };
    this.socketService.sendMessage(data, 'remoteData');
  }
}
