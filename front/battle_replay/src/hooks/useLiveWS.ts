import { useEffect, useRef } from 'react';
import { useLiveStore, type WsEvent } from '../store/useLiveStore';

const WS_URL = 'ws://192.168.31.95:8081/events';

export function useLiveWS() {
  const setStatus  = useLiveStore(s => s.setStatus);
  const processRaw = useLiveStore(s => s.processRaw);
  const retryRef   = useRef(0);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const connect = (): (() => void) => {
      const ws = new WebSocket(WS_URL);
      let closed = false;

      ws.onopen = () => {
        retryRef.current = 0;
        setStatus('connected');
      };

      ws.onmessage = (e) => {
        if (!e.data) return;
        try {
          const raw: WsEvent = JSON.parse(e.data);
          processRaw(raw);
        } catch { /* ignore malformed */ }
      };

      ws.onclose = () => {
        if (closed) return;
        closed = true;
        const delay = Math.min(100 * Math.pow(2, retryRef.current), 10_000);
        retryRef.current++;
        setStatus('reconnecting');
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();

      return () => {
        closed = true;
        ws.close();
      };
    };

    setStatus('reconnecting');
    const cleanup = connect();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cleanup?.();
      setStatus('disconnected');
    };
  }, [setStatus, processRaw]);
}
