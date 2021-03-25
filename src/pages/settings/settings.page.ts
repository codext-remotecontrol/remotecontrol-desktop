import { Component, OnInit } from '@angular/core';
import SimplePeer from 'simple-peer';
import 'webrtc-adapter';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  signalData = '';
  peer2;
  constructor() {}

  ngOnInit() {
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
      console.log('signal', JSON.stringify(data));
      // peer1.signal(data);
    });

    this.peer2.on('stream', (stream) => {
      const video = document.querySelector('video');
      console.log(video);
      video.srcObject = stream;
      video.play();
    });
  }

  test() {
    this.peer2.signal(JSON.parse(this.signalData));
  }
}
