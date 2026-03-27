import { Trash2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import React from 'react';
import { useLiveStore } from '../store/useLiveStore';
import { useLiveWS } from '../hooks/useLiveWS';
import { useBattleStore } from '../store/useBattleStore';
import { EventListPanel } from './EventListPanel';

// ── LivePanel：实时战报面板（已委托给 EventListPanel 渲染事件列表） ────────────

export const LivePanel: React.FC = () => {
  useLiveWS();

  const status    = useLiveStore(s => s.status);
  const killCount = useLiveStore(s => s.killCount);
  const resetLive = useLiveStore(s => s.resetLive);
  const initLive  = useBattleStore(s => s.initLiveSession);
  const session   = useBattleStore(s => s.session);

  const handleClear = () => {
    resetLive();
    initLive();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-zinc-950">
      {/* 顶部状态栏 */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        {status === 'connected' && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
            <Wifi size={11} />
            <span>已连接</span>
          </div>
        )}
        {status === 'reconnecting' && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <RefreshCw size={11} className="animate-spin" />
            <span>重连中</span>
          </div>
        )}
        {status === 'disconnected' && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-medium">
            <WifiOff size={11} />
            <span>未连接</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
          <span>总计 <span className="text-zinc-200">{session?.totalEvents ?? 0}</span></span>
          <span className="text-red-400">击杀 <span className="font-medium">{killCount}</span></span>
        </div>

        <div className="flex-1" />

        <button
          onClick={handleClear}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
        >
          <Trash2 size={11} />
          清空
        </button>
      </div>

      <EventListPanel isLive />
    </div>
  );
};
