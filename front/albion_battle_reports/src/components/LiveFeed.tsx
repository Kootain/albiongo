import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Skull, Heart, Zap, User, Activity } from 'lucide-react';
import { useRealtimeFeed, RawEvent, WsStatus } from '../hooks/useRealtimeFeed';

// Event codes (from pkg/protocol/codes.go)
const CODE_HEALTH_UPDATE = 6;
const CODE_DIED = 165;
const CODE_NEW_CHARACTER = 29;
const CODE_CAST_SPELL = 19;

const MAX_EVENTS = 200;

interface FeedItem {
  id: number;
  ts: number;
  code: number;
  raw: RawEvent;
}

let nextId = 0;

function formatTime(tsMs: number): string {
  const d = new Date(tsMs);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function EventRow({ item }: { item: FeedItem }) {
  const ev = item.raw;

  if (item.code === CODE_DIED) {
    const killer = (ev.KillerName as string) || '未知';
    const killerGuild = (ev.KillerGuild as string) || '';
    const victim = (ev.VictimName as string) || '未知';
    const victimGuild = (ev.VictimGuild as string) || '';
    return (
      <div className="flex items-start gap-2 py-1.5 px-3 bg-red-500/5 border-l-2 border-red-500/60 hover:bg-red-500/10 transition-colors">
        <Skull className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-red-300 font-medium">{killer}</span>
          {killerGuild && <span className="text-slate-500 text-xs ml-1">[{killerGuild}]</span>}
          <span className="text-slate-400 mx-1">击杀了</span>
          <span className="text-slate-300 font-medium">{victim}</span>
          {victimGuild && <span className="text-slate-500 text-xs ml-1">[{victimGuild}]</span>}
        </div>
        <span className="text-slate-600 text-xs shrink-0 font-mono">{formatTime(item.ts)}</span>
      </div>
    );
  }

  if (item.code === CODE_HEALTH_UPDATE) {
    const delta = ev.HealthDelta as number ?? 0;
    const name = (ev.Name as string) || `#${ev.ObjectID}`;
    const causerName = (ev.CauserName as string) || '';
    const isDamage = delta < 0;
    return (
      <div className="flex items-start gap-2 py-1 px-3 hover:bg-slate-800/30 transition-colors">
        {isDamage
          ? <Zap className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
          : <Heart className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
        }
        <div className="flex-1 min-w-0 text-sm">
          {causerName && causerName !== name && (
            <>
              <span className="text-slate-400">{causerName}</span>
              <span className="text-slate-600 mx-1">→</span>
            </>
          )}
          <span className={isDamage ? 'text-orange-300' : 'text-green-300'}>{name}</span>
          <span className={`ml-2 font-mono text-xs ${isDamage ? 'text-orange-400' : 'text-green-400'}`}>
            {isDamage ? '' : '+'}{Math.round(delta)}
          </span>
        </div>
        <span className="text-slate-600 text-xs shrink-0 font-mono">{formatTime(item.ts)}</span>
      </div>
    );
  }

  if (item.code === CODE_NEW_CHARACTER) {
    const name = (ev.Name as string) || `#${ev.ObjectID}`;
    const guild = (ev.GuildName as string) || '';
    return (
      <div className="flex items-start gap-2 py-1 px-3 hover:bg-slate-800/30 transition-colors">
        <User className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 text-sm text-slate-400">
          <span className="text-slate-300">{name}</span>
          {guild && <span className="text-slate-500 ml-1">[{guild}]</span>}
          <span className="ml-1">进入视野</span>
        </div>
        <span className="text-slate-600 text-xs shrink-0 font-mono">{formatTime(item.ts)}</span>
      </div>
    );
  }

  if (item.code === CODE_CAST_SPELL) {
    const caster = (ev.CasterName as string) || `#${ev.CasterID}`;
    const spellId = ev.SpellIndex as number;
    return (
      <div className="flex items-start gap-2 py-1 px-3 hover:bg-slate-800/30 transition-colors">
        <Activity className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 text-sm text-slate-400">
          <span className="text-slate-300">{caster}</span>
          <span className="ml-1">施放技能</span>
          <span className="ml-1 font-mono text-xs text-purple-400">#{spellId}</span>
        </div>
        <span className="text-slate-600 text-xs shrink-0 font-mono">{formatTime(item.ts)}</span>
      </div>
    );
  }

  // Generic fallback
  return (
    <div className="flex items-start gap-2 py-1 px-3 hover:bg-slate-800/30 transition-colors">
      <Activity className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 text-xs text-slate-500 font-mono">
        Code={item.code}
      </div>
      <span className="text-slate-600 text-xs shrink-0 font-mono">{formatTime(item.ts)}</span>
    </div>
  );
}

type FilterMode = 'all' | 'kill' | 'damage' | 'spell';

export function LiveFeed() {
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(autoScroll);

  useEffect(() => { autoScrollRef.current = autoScroll; }, [autoScroll]);

  // Stats counters
  const [stats, setStats] = useState({ kills: 0, dmgEvents: 0, spells: 0 });

  const handleEvent = useCallback((ev: RawEvent) => {
    if (ev.Type !== 0) return; // only normal events

    const item: FeedItem = {
      id: nextId++,
      ts: ev.Ts > 1e12 ? ev.Ts : ev.Ts * 1000, // handle ms vs s
      code: ev.Code,
      raw: ev,
    };

    setItems(prev => {
      const next = [item, ...prev];
      return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
    });

    if (ev.Code === CODE_DIED) setStats(s => ({ ...s, kills: s.kills + 1 }));
    else if (ev.Code === CODE_HEALTH_UPDATE) setStats(s => ({ ...s, dmgEvents: s.dmgEvents + 1 }));
    else if (ev.Code === CODE_CAST_SPELL) setStats(s => ({ ...s, spells: s.spells + 1 }));
  }, []);

  useRealtimeFeed({ onEvent: handleEvent, onStatusChange: setStatus });

  // Auto-scroll
  useEffect(() => {
    if (autoScrollRef.current && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [items]);

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop } = listRef.current;
    if (scrollTop > 60 && autoScroll) setAutoScroll(false);
    if (scrollTop < 5 && !autoScroll) setAutoScroll(true);
  };

  const filtered = items.filter(item => {
    if (filter === 'kill') return item.code === CODE_DIED;
    if (filter === 'damage') return item.code === CODE_HEALTH_UPDATE;
    if (filter === 'spell') return item.code === CODE_CAST_SPELL;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-white">实时战报</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-red-400"><Skull className="inline w-3 h-3 mr-0.5" />{stats.kills}</span>
            <span className="text-orange-400"><Zap className="inline w-3 h-3 mr-0.5" />{stats.dmgEvents}</span>
            <span className="text-purple-400"><Activity className="inline w-3 h-3 mr-0.5" />{stats.spells}</span>
          </div>
          {/* Connection badge */}
          {status === 'connected' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
              <Wifi className="w-3 h-3" /><span>已连接</span>
            </div>
          )}
          {status === 'reconnecting' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
              <RefreshCw className="w-3 h-3 animate-spin" /><span>重连中</span>
            </div>
          )}
          {status === 'disconnected' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-500 text-xs">
              <WifiOff className="w-3 h-3" /><span>未连接</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800 shrink-0">
        {(['all', 'kill', 'damage', 'spell'] as FilterMode[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {f === 'all' && '全部'}
            {f === 'kill' && '击杀'}
            {f === 'damage' && '伤害'}
            {f === 'spell' && '技能'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-600 font-mono">{filtered.length} 条</span>
      </div>

      {/* Event list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto text-sm divide-y divide-slate-800/50"
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
            <Activity className="w-8 h-8" />
            <p className="text-sm">等待战斗事件…</p>
            {status !== 'connected' && (
              <p className="text-xs">需要先连接到 127.0.0.1:8081</p>
            )}
          </div>
        ) : (
          filtered.map(item => (
            <React.Fragment key={item.id}>
              <EventRow item={item} />
            </React.Fragment>
          ))
        )}
      </div>

      {!autoScroll && (
        <button
          onClick={() => { setAutoScroll(true); listRef.current && (listRef.current.scrollTop = 0); }}
          className="absolute bottom-4 right-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-full shadow-lg transition-colors"
        >
          回到顶部
        </button>
      )}
    </div>
  );
}
