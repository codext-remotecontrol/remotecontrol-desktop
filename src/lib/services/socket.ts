import { io, Socket } from 'socket.io-client';
import { writable, type Writable } from 'svelte/store';

const SOCKET_URL = 'https://node.remote-control.codext.de';

export interface PeerInfo {
  id: string;
  hostname: string;
  platform: string;
}

export const connected: Writable<boolean> = writable(false);
export const connectionId: Writable<string> = writable('');

let socket: Socket | null = null;
let messageHandlers: Map<string, (data: any) => void> = new Map();

export function connect(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket?.connected) {
      socket.disconnect();
    }

    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      socket?.emit('register', { id });
      connected.set(true);
      connectionId.set(id);
      resolve();
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      connected.set(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      connected.set(false);
      reject(error);
    });

    // Handle incoming messages
    socket.on('signal', (data) => {
      const handler = messageHandlers.get('signal');
      if (handler) handler(data);
    });

    socket.on('peer-connected', (data) => {
      const handler = messageHandlers.get('peer-connected');
      if (handler) handler(data);
    });

    socket.on('peer-disconnected', (data) => {
      const handler = messageHandlers.get('peer-disconnected');
      if (handler) handler(data);
    });

    socket.on('connection-request', (data) => {
      const handler = messageHandlers.get('connection-request');
      if (handler) handler(data);
    });

    socket.on('connection-response', (data) => {
      const handler = messageHandlers.get('connection-response');
      if (handler) handler(data);
    });

    socket.on('password-request', (data) => {
      const handler = messageHandlers.get('password-request');
      if (handler) handler(data);
    });

    socket.on('password-response', (data) => {
      const handler = messageHandlers.get('password-response');
      if (handler) handler(data);
    });
  });
}

export function disconnect(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  connected.set(false);
}

export function emit(event: string, data: any): void {
  if (socket?.connected) {
    socket.emit(event, data);
  }
}

export function on(event: string, handler: (data: any) => void): void {
  messageHandlers.set(event, handler);
}

export function off(event: string): void {
  messageHandlers.delete(event);
}

export function sendSignal(targetId: string, signal: any): void {
  emit('signal', { targetId, signal });
}

export function requestConnection(targetId: string, info: PeerInfo): void {
  emit('connection-request', { targetId, info });
}

export function respondToConnection(targetId: string, accepted: boolean): void {
  emit('connection-response', { targetId, accepted });
}

export function sendPasswordResponse(targetId: string, password: string): void {
  emit('password-response', { targetId, password });
}
