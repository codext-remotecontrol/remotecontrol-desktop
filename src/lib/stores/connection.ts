import { writable } from 'svelte/store';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type ConnectionMode = 'host' | 'client' | null;

export interface PeerInfo {
  id: string;
  hostname: string;
  platform: string;
}

export interface ConnectionState {
  status: ConnectionStatus;
  mode: ConnectionMode;
  peerId: string | null;
  peerInfo: PeerInfo | null;
  error: string | null;
}

const initialState: ConnectionState = {
  status: 'disconnected',
  mode: null,
  peerId: null,
  peerInfo: null,
  error: null
};

function createConnectionStore() {
  const { subscribe, set, update } = writable<ConnectionState>(initialState);

  return {
    subscribe,
    setConnecting: (mode: ConnectionMode, peerId: string) => {
      update(s => ({
        ...s,
        status: 'connecting',
        mode,
        peerId,
        error: null
      }));
    },
    setConnected: (peerInfo: PeerInfo) => {
      update(s => ({
        ...s,
        status: 'connected',
        peerInfo
      }));
    },
    setError: (error: string) => {
      update(s => ({
        ...s,
        status: 'error',
        error
      }));
    },
    disconnect: () => {
      set(initialState);
    },
    reset: () => {
      set(initialState);
    }
  };
}

export const connection = createConnectionStore();
