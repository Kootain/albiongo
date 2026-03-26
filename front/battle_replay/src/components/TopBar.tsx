import { FolderOpen, Loader2 } from 'lucide-react';
import React, { useRef } from 'react';
import { useBattleStore } from '../store/useBattleStore';
import { useTimelineStore } from '../store/useTimelineStore';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}分${String(s).padStart(2, '0')}秒`;
}

function formatTs(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false });
}

export const TopBar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const session = useBattleStore(s => s.session);
  const isLoading = useBattleStore(s => s.isLoading);
  const loadProgress = useBattleStore(s => s.loadProgress);
  const loadError = useBattleStore(s => s.loadError);
  const loadFile = useBattleStore(s => s.loadFile);
  const initViewport = useTimelineStore(s => s.initViewport);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFile(file);
    // 解析完成后 store 会更新 session，通过 useEffect 初始化视口
    e.target.value = '';
  };

  // 当 session 加载完成时初始化时间轴视口（初始显示前 60 秒）
  React.useEffect(() => {
    if (session) {
      const initialWindow = Math.min(session.durationMs, 60_000);
      initViewport(session.startTs, session.endTs, session.startTs, session.startTs + initialWindow);
    }
  }, [session, initViewport]);

  return (
    <div className="flex-shrink-0 h-12 flex items-center gap-4 px-4 bg-zinc-900 border-b border-zinc-800">
      {/* Logo */}
      <span className="text-sm font-semibold text-zinc-100 tracking-wide flex-shrink-0">
        Albion 战斗复盘
      </span>

      <div className="w-px h-5 bg-zinc-800 flex-shrink-0" />

      {/* 文件选择按钮 */}
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
      {session && !isLoading && (
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

      {/* 错误提示 */}
      {loadError && (
        <span className="text-sm text-red-400 truncate">{loadError}</span>
      )}

      {/* 进度条 */}
      {isLoading && (
        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
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
