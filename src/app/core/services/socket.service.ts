import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://192.168.178.192:3000');
    // this.socket.join('game');
  }

  // EMITTER
  sendMessage(msg: any, type: 'call' | 'remoteData' = 'call') {
    this.socket.emit(type, msg);
  }

  onNewMessage(type: 'message' | 'remoteData' = 'message') {
    return new Observable((observer) => {
      this.socket.on(type, (msg) => {
        observer.next(msg);
      });
    });
  }
}
