import { useEffect, useRef, useCallback } from 'react';

export type WsStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface RawEvent {
  Type: number;
  Code: number;
  Ts: number;
  [key: string]: unknown;
}

interface Options {
  onEvent: (ev: RawEvent) => void;
  onStatusChange: (status: WsStatus) => void;
}

const WS_URL = 'ws://127.0.0.1:8081/events';

export function useRealtimeFeed({ onEvent, onStatusChange }: Options) {
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  const onStatusRef = useRef(onStatusChange);

  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);
  useEffect(() => { onStatusRef.current = onStatusChange; }, [onStatusChange]);

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    let isClosed = false;

    ws.onopen = () => {
      retryCountRef.current = 0;
      onStatusRef.current('connected');
    };

    ws.onmessage = (e) => {
      if (!e.data) return;
      try {
        const ev: RawEvent = JSON.parse(e.data);
        onEventRef.current(ev);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (isClosed) return;
      isClosed = true;
      const retryCount = retryCountRef.current;
      const delayMs = Math.min(100 * Math.pow(2, retryCount), 10000);
      retryCountRef.current = retryCount + 1;
      onStatusRef.current('reconnecting');
      retryTimerRef.current = setTimeout(connect, delayMs);
    };

    ws.onerror = () => {
      ws.close();
    };

    return () => {
      isClosed = true;
      ws.close();
    };
  }, []);

  useEffect(() => {
    onStatusRef.current('reconnecting');
    const cleanup = connect();
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      cleanup?.();
      onStatusRef.current('disconnected');
    };
  }, [connect]);
}
