import { RotateCcw } from 'lucide-react';
import React, { useState } from 'react';
import { useBattleStore } from '../store/useBattleStore';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, type EventType } from '../types';

const EVENT_TYPE_GROUPS: { label: string; types: EventType[] }[] = [
  {
    label: '战斗核心',
    types: ['kill', 'attack', 'cast_spell', 'cast_hit', 'cast_hits', 'cast_start', 'cast_finished', 'cast_cancel', 'channeling_ended', 'forced_movement'],
  },
  {
    label: '状态变化',
    types: ['health_update', 'health_updates', 'energy_update', 'spell_effect_area'],
  },
  {
    label: '玩家动态',
    types: ['new_character', 'leave', 'equipment_change', 'mounted', 'mount_start'],
  },
  {
    label: '其他',
    types: ['unknown'],
  },
];

export const FilterPanel: React.FC = () => {
  const session = useBattleStore(s => s.session);
  const filters = useBattleStore(s => s.filters);
  const showAllEvents = useBattleStore(s => s.showAllEvents);
  const setEventTypeFilter = useBattleStore(s => s.setEventTypeFilter);
  const setGuildFilter = useBattleStore(s => s.setGuildFilter);
  const setPlayerNameFilter = useBattleStore(s => s.setPlayerNameFilter);
  const resetFilters = useBattleStore(s => s.resetFilters);
  const toggleShowAllEvents = useBattleStore(s => s.toggleShowAllEvents);

  const [guildSearch, setGuildSearch] = useState('');

  const visibleGuilds = session?.guilds.filter(g =>
    g.toLowerCase().includes(guildSearch.toLowerCase())
  ) ?? [];

  return (
    <div className="w-56 flex-shrink-0 flex flex-col bg-zinc-900 border-r border-zinc-800 overflow-y-auto">

      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-zinc-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">过滤器</span>
        <button
          onClick={resetFilters}
          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors rounded"
          title="重置过滤器"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* 全量展示开关 */}
      <div className="px-3 py-3 border-b border-zinc-800">
        <button
          onClick={toggleShowAllEvents}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg border transition-colors text-sm
            ${showAllEvents
              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
            }`}
        >
          <span>展示全部事件</span>
          <span className={`w-8 h-4 rounded-full flex items-center transition-colors ${showAllEvents ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
            <span className={`w-3 h-3 rounded-full bg-white mx-0.5 transition-transform ${showAllEvents ? 'translate-x-4' : 'translate-x-0'}`} />
          </span>
        </button>
        {showAllEvents && session && (
          <p className="text-xs text-zinc-600 mt-1.5 px-0.5">
            共 {session.totalEvents.toLocaleString()} 条，过滤器已暂停
          </p>
        )}
      </div>

      {/* 玩家名搜索 */}
      <div className="px-3 py-3 border-b border-zinc-800">
        <label className="text-xs uppercase tracking-wider text-zinc-500 mb-1.5 block">玩家名</label>
        <input
          type="text"
          placeholder="搜索玩家..."
          value={filters.playerName}
          onChange={e => setPlayerNameFilter(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200
                     px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors
                     placeholder:text-zinc-600"
        />
      </div>

      {/* 事件类型 */}
      <div className="px-3 py-3 border-b border-zinc-800">
        <label className="text-xs uppercase tracking-wider text-zinc-500 mb-2 block">事件类型</label>
        <div className="space-y-3">
          {EVENT_TYPE_GROUPS.map(group => (
            <div key={group.label}>
              <div className="text-xs text-zinc-600 mb-1 px-1">{group.label}</div>
              <div className="space-y-0.5">
                {group.types.map(type => {
                  const enabled = filters.eventTypes.has(type);
                  const count = session?.eventTypeCounts[type] ?? 0;
                  return (
                    <button
                      key={type}
                      onClick={() => setEventTypeFilter(type, !enabled)}
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors
                        ${enabled ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: enabled ? EVENT_TYPE_COLORS[type] : '#3f3f46' }}
                      />
                      <span className="flex-1 text-left truncate text-xs">{EVENT_TYPE_LABELS[type]}</span>
                      {count > 0 && (
                        <span className="text-xs font-mono text-zinc-600">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 公会过滤 */}
      {session && session.guilds.length > 0 && (
        <div className="px-3 py-3 flex-1">
          <label className="text-xs uppercase tracking-wider text-zinc-500 mb-1.5 block">
            公会 ({filters.guilds.size > 0 ? `${filters.guilds.size} 已选` : '全部'})
          </label>
          {session.guilds.length > 6 && (
            <input
              type="text"
              placeholder="搜索公会..."
              value={guildSearch}
              onChange={e => setGuildSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200
                         px-2.5 py-1.5 mb-2 focus:outline-none focus:border-indigo-500 transition-colors
                         placeholder:text-zinc-600"
            />
          )}
          <div className="space-y-1">
            {visibleGuilds.map(guild => {
              const selected = filters.guilds.has(guild);
              return (
                <button
                  key={guild}
                  onClick={() => setGuildFilter(guild, !selected)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left
                    ${selected ? 'bg-indigo-900/30 border border-indigo-500/30 text-indigo-300'
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                >
                  <span className="flex-1 truncate">{guild}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
