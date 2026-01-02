import { Injectable, NgZone } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export type MessageType = 'message' | 'call' | 'remoteData' | 'signaling';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  public socket: Socket | null = null;

  private connected$ = new BehaviorSubject<boolean>(false);
  private messageSubject$ = new Subject<any>();
  private signalingSubject$ = new Subject<any>();
  private remoteDataSubject$ = new Subject<any>();
  private disconnectedSubject$ = new Subject<void>();

  constructor(private ngZone: NgZone) {}

  init(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.ngZone.run(() => {
        console.log('Socket connected:', this.socket?.id);
        this.connected$.next(true);
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.ngZone.run(() => {
        console.log('Socket disconnected:', reason);
        this.connected$.next(false);
        this.disconnectedSubject$.next();
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('message', (msg) => {
      this.ngZone.run(() => {
        this.messageSubject$.next(msg);
      });
    });

    this.socket.on('signaling', (msg) => {
      this.ngZone.run(() => {
        this.signalingSubject$.next(msg);
      });
    });

    this.socket.on('remoteData', (msg) => {
      this.ngZone.run(() => {
        this.remoteDataSubject$.next(msg);
      });
    });
  }

  destroy(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connected$.next(false);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  onConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  joinRoom(id: string): void {
    if (this.socket?.connected) {
      console.log('Joining room:', id);
      this.socket.emit('join', id);
    } else {
      console.warn('Cannot join room: socket not connected');
    }
  }

  leaveRoom(id: string): void {
    if (this.socket?.connected) {
      console.log('Leaving room:', id);
      this.socket.emit('leave', id);
    }
  }

  sendMessage(msg: any, type: MessageType = 'remoteData'): void {
    if (this.socket?.connected) {
      this.socket.emit(type, { data: msg });
    } else {
      console.warn('Cannot send message: socket not connected');
    }
  }

  sendSignaling(data: any): void {
    if (this.socket?.connected) {
      this.socket.emit('signaling', data);
    }
  }

  onDisconnected(): Observable<void> {
    return this.disconnectedSubject$.asObservable();
  }

  onNewMessage(type: MessageType = 'remoteData'): Observable<any> {
    switch (type) {
      case 'message':
        return this.messageSubject$.asObservable();
      case 'signaling':
        return this.signalingSubject$.asObservable();
      case 'remoteData':
      default:
        return this.remoteDataSubject$.asObservable();
    }
  }

  // Convenience method for getting raw socket events
  on(event: string): Observable<any> {
    return new Observable((observer) => {
      const handler = (data: any) => {
        this.ngZone.run(() => observer.next(data));
      };

      this.socket?.on(event, handler);

      return () => {
        this.socket?.off(event, handler);
      };
    });
  }

  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}
