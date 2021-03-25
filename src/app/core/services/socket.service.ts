import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000');
    // this.socket.join('game');
  }

  // EMITTER
  sendMessage(msg: string) {
    this.socket.emit('call', { msg: msg });
  }

  onNewMessage() {
    return new Observable((observer) => {
      this.socket.on('message', (msg) => {
        observer.next(msg);
      });
    });
  }
}
