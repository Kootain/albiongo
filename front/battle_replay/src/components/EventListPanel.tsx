import React, { useRef, useEffect, useState } from 'react';
import { getItemName, getSpellName } from '@albion/game-data';
import { useBattleStore } from '../store/useBattleStore';
import { useTimelineStore } from '../store/useTimelineStore';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, type BattleEvent, type EventType } from '../types';

// SpellIndex / SpellID 均为直接 DB ID
function resolveSpell(spellId: number | undefined): string | undefined {
  if (spellId === undefined || spellId < 0) return undefined;
  const name = getSpellName(spellId);
  return name || undefined;
}

function resolveItem(itemId: number | undefined): string | undefined {
  if (itemId === undefined || itemId === 0) return undefined;
  const name = getItemName(itemId);
  return name || undefined;
}

// ── 单条事件行 ─────────────────────────────────────────────────────────────────

const EventRow: React.FC<{ ev: BattleEvent; selected: boolean }> = ({ ev, selected }) => {
  const color = EVENT_TYPE_COLORS[ev.type] ?? '#3f3f46';
  const label = EVENT_TYPE_LABELS[ev.type] ?? ev.type;
  const ts    = new Date(ev.ts).toLocaleTimeString('zh-CN', { hour12: false });
  const isKill = ev.type === 'kill';

  const spellName = resolveSpell(ev.spellId);

  // 装备列表（仅 new_character / equipment_change 有意义）
  const equipLine = ev.equipmentIds?.length
    ? ev.equipmentIds.map(id => resolveItem(id) ?? `#${id}`).join(' / ')
    : undefined;

  const handleClick = () => {
    useTimelineStore.getState().selectEvent(selected ? null : ev);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-2 py-1.5 px-3 border-b border-zinc-800/40 cursor-pointer transition-colors text-sm
        ${selected
          ? 'bg-indigo-600/15 border-l-2 border-l-indigo-500'
          : isKill
            ? 'bg-red-500/5 border-l-2 border-l-red-500/50 hover:bg-zinc-900/60'
            : 'hover:bg-zinc-900/60'
        }`}
    >

      {/* 色点 + 事件类型 */}
      <span className="flex items-center gap-1 text-xs font-mono text-zinc-500 w-20 flex-shrink-0 pt-0.5">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        {label}
      </span>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0 leading-snug">
        {/* 施法者 / 行动者 */}
        {ev.actorName && (
          <span className={isKill ? 'text-red-300 font-medium' : 'text-zinc-200'}>
            {ev.actorName}
          </span>
        )}
        {ev.actorGuild && (
          <span className="text-zinc-600 text-xs ml-1">[{ev.actorGuild}]</span>
        )}

        {/* 技能名 */}
        {spellName && (
          <span className="text-indigo-400 text-xs ml-2 font-medium">{spellName}</span>
        )}

        {/* 目标 */}
        {ev.targetName && (
          <>
            <span className="text-zinc-600 mx-1">{isKill ? '击杀' : '→'}</span>
            <span className={isKill ? 'text-zinc-300 font-medium' : 'text-zinc-400'}>
              {ev.targetName}
            </span>
            {ev.targetGuild && (
              <span className="text-zinc-600 text-xs ml-1">[{ev.targetGuild}]</span>
            )}
          </>
        )}

        {/* 伤害/治疗数值 */}
        {ev.damage !== undefined && (
          <span className={`ml-2 font-mono text-xs ${ev.damage < 0 ? 'text-red-400' : 'text-green-400'}`}>
            {ev.damage < 0 ? ev.damage.toFixed(0) : `+${ev.damage.toFixed(0)}`}
          </span>
        )}

        {/* 装备（折叠显示） */}
        {equipLine && (
          <div className="text-zinc-600 text-xs mt-0.5 truncate">{equipLine}</div>
        )}

        {/* 无名玩家时 fallback */}
        {!ev.actorName && !ev.targetName && (
          <span className="text-zinc-600 text-xs font-mono">Code={ev.raw.Code}</span>
        )}
      </div>

      {/* 时间戳 */}
      <span className="text-zinc-700 text-xs font-mono flex-shrink-0 pt-0.5">{ts}</span>
    </div>
  );
};

// ── 快速筛选 Tab ───────────────────────────────────────────────────────────────

type QuickFilter = 'all' | 'kill' | 'damage' | 'spell' | 'appear';

const QUICK_FILTERS: { key: QuickFilter; label: string; types?: EventType[] }[] = [
  { key: 'all',    label: '全部' },
  { key: 'kill',   label: '击杀',  types: ['kill'] },
  { key: 'damage', label: '伤害',  types: ['health_update', 'health_updates'] },
  { key: 'spell',  label: '施法',  types: ['cast_spell', 'cast_hit', 'cast_hits'] },
  { key: 'appear', label: '出现',  types: ['new_character', 'equipment_change', 'leave'] },
];

// ── 主组件 ────────────────────────────────────────────────────────────────────

interface EventListPanelProps {
  /** 实时模式：新事件追加到底部并自动滚动 */
  isLive?: boolean;
}

export const EventListPanel: React.FC<EventListPanelProps> = ({ isLive = false }) => {
  const filteredEvents = useBattleStore(s => s.filteredEvents);
  const selectedEvent  = useTimelineStore(s => s.selectedEvent);

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [autoScroll, setAutoScroll]   = useState(true);
  const listRef        = useRef<HTMLDivElement>(null);
  const autoScrollRef  = useRef(autoScroll);
  useEffect(() => { autoScrollRef.current = autoScroll; }, [autoScroll]);

  // 实时模式：新事件进来时滚动到底部
  useEffect(() => {
    if (!isLive || !autoScrollRef.current || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [filteredEvents.length, isLive]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el || !isLive) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (!atBottom && autoScroll)  setAutoScroll(false);
    if (atBottom  && !autoScroll) setAutoScroll(true);
  };

  const activeQF = QUICK_FILTERS.find(f => f.key === quickFilter)!;
  const displayed = activeQF.types
    ? filteredEvents.filter(ev => activeQF.types!.includes(ev.type))
    : filteredEvents;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-zinc-950 relative">
      {/* 快速筛选 Tab */}
      <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-zinc-800/60 bg-zinc-900">
        {QUICK_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setQuickFilter(f.key)}
            className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors
              ${quickFilter === f.key
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-700 font-mono">{displayed.length} 条</span>
      </div>

      {/* 事件列表 */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-600">
            <p className="text-sm">{isLive ? '等待战斗事件…' : '暂无匹配事件'}</p>
          </div>
        ) : (
          displayed.map(ev => <EventRow key={ev.id} ev={ev} selected={selectedEvent?.id === ev.id} />)
        )}
      </div>

      {/* 实时模式：回到最新按钮 */}
      {isLive && !autoScroll && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={() => {
              setAutoScroll(true);
              if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-full shadow-lg transition-colors"
          >
            回到最新
          </button>
        </div>
      )}
    </div>
  );
};
