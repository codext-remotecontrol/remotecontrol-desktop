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
let currentRoom: string = '';
let messageHandlers: Map<string, (data: any) => void> = new Map();

export function connect(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket?.connected) {
      socket.disconnect();
    }

    console.log('Connecting to signaling server:', SOCKET_URL, 'with ID:', id);

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    // Set connection ID immediately so UI shows it
    connectionId.set(id);
    currentRoom = id;

    socket.on('connect', () => {
      console.log('Socket connected successfully, joining room:', id);
      socket?.emit('join', id);
      connected.set(true);
      resolve();
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      connected.set(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      connected.set(false);
      reject(new Error(`Connection error: ${error.message}`));
    });

    // Handle incoming remote data (all signaling goes through this)
    socket.on('remoteData', (data) => {
      console.log('Received remoteData:', data);
      if (data && data.type) {
        const handler = messageHandlers.get(data.type);
        if (handler) handler(data);
      }
    });

    // Handle peer disconnection
    socket.on('disconnected', () => {
      console.log('Peer disconnected');
      const handler = messageHandlers.get('peer-disconnected');
      if (handler) handler({});
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

// Send data to the current room
export function emit(type: string, data: any): void {
  if (socket?.connected) {
    socket.emit('remoteData', { data: { type, ...data } });
  }
}

// Send data to a specific room/peer
export function emitToRoom(room: string, type: string, data: any): void {
  if (socket?.connected) {
    socket.emit('remoteData', { room, data: { type, ...data } });
  }
}

export function on(event: string, handler: (data: any) => void): void {
  messageHandlers.set(event, handler);
}

export function off(event: string): void {
  messageHandlers.delete(event);
}

// WebRTC signaling
export function sendSignal(targetId: string, signal: any): void {
  emitToRoom(targetId, 'signal', { fromId: currentRoom, signal });
}

// Connection request
export function requestConnection(targetId: string, info: PeerInfo): void {
  emitToRoom(targetId, 'connection-request', { fromId: currentRoom, info });
}

// Connection response
export function respondToConnection(targetId: string, accepted: boolean): void {
  emitToRoom(targetId, 'connection-response', { fromId: currentRoom, accepted });
}

// Password handling
export function requestPassword(targetId: string): void {
  emitToRoom(targetId, 'password-request', { fromId: currentRoom });
}

export function sendPasswordResponse(targetId: string, password: string): void {
  emitToRoom(targetId, 'password-response', { fromId: currentRoom, password });
}
