import React from 'react';
import { loadGameData } from '@albion/game-data';
import { BarChart2, Clock, List, Users } from 'lucide-react';
import { EventDrawer } from './components/EventDrawer';
import { EventListPanel } from './components/EventListPanel';
import { FilterPanel } from './components/FilterPanel';
import { StatsPanel } from './components/StatsPanel';
import { PlayerTimelineCanvas } from './components/Timeline/PlayerTimelineCanvas';
import { TimelineCanvas } from './components/Timeline/TimelineCanvas';
import { TopBar } from './components/TopBar';
import { useBattleStore } from './store/useBattleStore';
import { useLiveStore } from './store/useLiveStore';
import { useTimelineStore } from './store/useTimelineStore';
import { useLiveWS } from './hooks/useLiveWS';
import { usePlayerSync } from './hooks/usePlayerSync';

type SourceMode = 'file' | 'live';
type ViewMode   = 'timeline' | 'player_timeline' | 'events' | 'stats';

// ── 实时 WS 连接（仅在 live 模式下挂载） ─────────────────────────────────────

const LiveConnector: React.FC = () => {
  useLiveWS();
  usePlayerSync();
  return null;
};

// ── 主应用 ────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  React.useEffect(() => {
    loadGameData().catch(console.error);
  }, []);

  const [source, setSource] = React.useState<SourceMode>('file');
  const [view,   setView]   = React.useState<ViewMode>('timeline');

  const initLiveSession = useBattleStore(s => s.initLiveSession);
  const resetLive       = useLiveStore(s => s.resetLive);
  const isLive          = useBattleStore(s => s.isLive);
  const session         = useBattleStore(s => s.session);

  // ── 视口管理 ────────────────────────────────────────────────────────────────

  // 文件模式：新文件加载完成后初始化视口（显示最初 60 秒）
  React.useEffect(() => {
    if (isLive || !session || session.totalEvents === 0) return;
    const win = Math.min(session.durationMs, 60_000);
    useTimelineStore.getState().initViewport(
      session.startTs, session.endTs,
      session.startTs, session.startTs + win,
    );
  }, [isLive, session]); // session reference changes only on new file load

  // 实时模式：切换时重置视口
  React.useEffect(() => {
    if (source !== 'live') return;
    useTimelineStore.getState().initViewport(0, 60_000, 0, 60_000);
  }, [source]);

  // 实时模式：随事件推进，自动跟随最新内容
  React.useEffect(() => {
    if (!isLive || !session || session.totalEvents === 0) return;
    const store = useTimelineStore.getState();
    const WIN   = 60_000;
    const end   = session.endTs;
    const start = session.startTs;

    if (store.sessionDurationMs === 0) {
      // 首次有事件：完整初始化视口
      store.initViewport(start, end + WIN, end, end + WIN);
    } else {
      // 扩展会话边界（不重置视口 scrollY / selectedEvent）
      store.setSessionBounds(start, end + WIN);
      // 自动跟随：viewport 右侧始终贴近最新时间戳
      const vp    = store.viewport;
      const range = vp.endTs - vp.startTs;
      store.setViewport({ startTs: end - range + 2_000, endTs: end + 2_000 });
    }
  }, [isLive, session?.endTs]); // eslint-disable-line react-hooks/exhaustive-deps

  // 切换到实时模式时初始化空 session；切回文件模式时重置实时状态
  const handleSourceChange = (next: SourceMode) => {
    if (next === source) return;
    if (next === 'live') {
      initLiveSession();
    } else {
      resetLive();
    }
    setSource(next);
  };

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-zinc-950 text-zinc-100 font-sans select-none">
      {/* WS 连接器，仅在 live 模式下挂载 */}
      {source === 'live' && <LiveConnector />}

      {/* 顶部栏（含文件加载 / 连接状态） */}
      <TopBar source={source} />

      {/* 数据源 + 视图切换栏 */}
      <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">

        {/* 数据源选择器 */}
        <div className="flex items-center gap-0.5 bg-zinc-800/60 rounded-lg p-0.5 mr-2">
          <button
            onClick={() => handleSourceChange('file')}
            className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors
              ${source === 'file'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            文件
          </button>
          <button
            onClick={() => handleSourceChange('live')}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors
              ${source === 'live'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {/* WS 状态指示点 */}
            <WsStatusDot active={source === 'live'} />
            实时
          </button>
        </div>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        {/* 视图选择 */}
        <button
          onClick={() => setView('timeline')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors
            ${view === 'timeline'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
        >
          <Clock size={12} />
          事件流
        </button>
        <button
          onClick={() => setView('player_timeline')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors
            ${view === 'player_timeline'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
        >
          <Users size={12} />
          玩家轴
        </button>
        <button
          onClick={() => setView('events')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors
            ${view === 'events'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
        >
          <List size={12} />
          事件列表
        </button>
        <button
          onClick={() => setView('stats')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors
            ${view === 'stats'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
        >
          <BarChart2 size={12} />
          统计
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 过滤面板（时间轴 / 事件列表 / 统计 均可用，实时模式也支持） */}
        <FilterPanel />

        {view === 'timeline' && (
          <>
            <TimelineCanvas />
            <EventDrawer />
          </>
        )}
        {view === 'player_timeline' && (
          <>
            <PlayerTimelineCanvas />
            <EventDrawer />
          </>
        )}
        {view === 'events' && (
          <>
            <EventListPanel isLive={isLive} />
            <EventDrawer />
          </>
        )}
        {view === 'stats' && (
          <StatsPanel />
        )}
      </div>
    </div>
  );
};

// ── WS 状态指示点（实时模式下显示连接状态颜色） ──────────────────────────────

const WsStatusDot: React.FC<{ active: boolean }> = ({ active }) => {
  const status = useLiveStore(s => s.status);
  if (!active) return <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />;
  const color =
    status === 'connected'    ? 'bg-green-400' :
    status === 'reconnecting' ? 'bg-amber-400 animate-pulse' :
                                'bg-zinc-600';
  return <span className={`w-1.5 h-1.5 rounded-full ${color}`} />;
};

export default App;
