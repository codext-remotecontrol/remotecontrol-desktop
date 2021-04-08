import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  public socket: Socket;

  constructor() {}

  init() {
    this.socket = io('https://node.remote-control.codext.de');
  }

  destroy() {
    this.socket?.disconnect();
  }

  joinRoom(id: string) {
    console.log('join', id);
    this.socket.emit('join', id);
  }

  sendMessage(
    msg: any,
    type: 'message' | 'call' | 'remoteData' = 'remoteData'
  ) {
    this.socket.emit(type, { data: msg });
  }

  onDisconnected() {
    return new Observable((observer) => {
      this.socket.on('disconnected', () => {
        console.log('disconnected');
        observer.next('disconnected');
      });
    });
  }

  onNewMessage(type: 'message' | 'remoteData' | 'signaling' = 'remoteData') {
    return new Observable((observer) => {
      this.socket.on(type, (msg) => {
        observer.next(msg);
      });
    });
  }
}
