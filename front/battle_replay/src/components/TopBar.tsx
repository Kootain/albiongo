import { FolderOpen, Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import React, { useRef } from 'react';
import { useBattleStore } from '../store/useBattleStore';
import { useLiveStore } from '../store/useLiveStore';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}分${String(s).padStart(2, '0')}秒`;
}

function formatTs(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false });
}

interface TopBarProps {
  source: 'file' | 'live';
}

export const TopBar: React.FC<TopBarProps> = ({ source }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const session      = useBattleStore(s => s.session);
  const isLoading    = useBattleStore(s => s.isLoading);
  const loadProgress = useBattleStore(s => s.loadProgress);
  const loadError    = useBattleStore(s => s.loadError);
  const loadFile     = useBattleStore(s => s.loadFile);
  const isLive       = useBattleStore(s => s.isLive);
  const wsStatus     = useLiveStore(s => s.status);
  const killCount    = useLiveStore(s => s.killCount);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFile(file);
    e.target.value = '';
  };

  return (
    <div className="flex-shrink-0 h-12 flex items-center gap-4 px-4 bg-zinc-900 border-b border-zinc-800">
      {/* Logo */}
      <span className="text-sm font-semibold text-zinc-100 tracking-wide flex-shrink-0">
        Albion 战斗复盘
      </span>

      <div className="w-px h-5 bg-zinc-800 flex-shrink-0" />

      {source === 'file' ? (
        /* ── 文件模式：打开日志按钮 ─────────────────── */
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500
                       disabled:bg-zinc-700 disabled:cursor-not-allowed
                       text-white text-sm rounded-lg transition-colors flex-shrink-0"
          >
            {isLoading
              ? <Loader2 size={14} className="animate-spin" />
              : <FolderOpen size={14} />
            }
            <span>{isLoading ? `解析中 ${loadProgress}%` : '打开日志'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jsonl,.json"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* 战斗信息 */}
          {session && !isLoading && !isLive && (
            <>
              <div className="w-px h-5 bg-zinc-800 flex-shrink-0" />
              <div className="flex items-center gap-4 text-sm min-w-0">
                <Stat label="开始" value={formatTs(session.startTs)} />
                <Stat label="时长" value={formatDuration(session.durationMs)} />
                <Stat label="事件" value={session.totalEvents.toLocaleString()} />
                <Stat label="玩家" value={Object.keys(session.players).length.toString()} />
                <Stat label="公会" value={session.guilds.length.toString()} />
              </div>
            </>
          )}

          {loadError && (
            <span className="text-sm text-red-400 truncate">{loadError}</span>
          )}
          {isLoading && (
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          )}
        </>
      ) : (
        /* ── 实时模式：WS 连接状态 ──────────────────── */
        <>
          {wsStatus === 'connected' && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
              <Wifi size={11} />
              <span>已连接</span>
            </div>
          )}
          {wsStatus === 'reconnecting' && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              <RefreshCw size={11} className="animate-spin" />
              <span>重连中</span>
            </div>
          )}
          {wsStatus === 'disconnected' && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-medium">
              <WifiOff size={11} />
              <span>未连接</span>
            </div>
          )}

          {session && (
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
              <span>事件 <span className="text-zinc-200">{session.totalEvents.toLocaleString()}</span></span>
              <span className="text-red-400">击杀 <span className="font-medium">{killCount}</span></span>
              <span>玩家 <span className="text-zinc-200">{Object.keys(session.players).length}</span></span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-xs uppercase tracking-wider text-zinc-500">{label}</span>
    <span className="font-mono text-zinc-200 text-xs">{value}</span>
  </div>
);
