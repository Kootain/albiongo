import { create } from 'zustand';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface ConnectionStore {
  status: ConnectionStatus;
  retryCount: number;
  nextRetryMs: number;
  setConnected: () => void;
  setReconnecting: (retryCount: number, nextRetryMs: number) => void;
  setDisconnected: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  status: 'disconnected',
  retryCount: 0,
  nextRetryMs: 0,

  setConnected: () => set({ status: 'connected', retryCount: 0, nextRetryMs: 0 }),
  setReconnecting: (retryCount, nextRetryMs) =>
    set({ status: 'reconnecting', retryCount, nextRetryMs }),
  setDisconnected: () => set({ status: 'disconnected' }),
}));
