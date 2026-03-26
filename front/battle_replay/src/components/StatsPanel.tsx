import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useBattleStore } from '../store/useBattleStore';
import type { BattleEvent, BattleSession } from '../types';

interface PlayerStats {
  objectId: number;
  name: string;
  guildName: string;
  damageDealt: number;
  damageTaken: number;
  healingReceived: number;
  kills: number;
  deaths: number;
}

function computeStats(session: BattleSession): PlayerStats[] {
  const statsMap = new Map<number, PlayerStats>();

  const getOrCreate = (id: number): PlayerStats => {
    if (!statsMap.has(id)) {
      const profile = session.players[id];
      statsMap.set(id, {
        objectId: id,
        name: profile?.name ?? `#${id}`,
        guildName: profile?.guildName ?? '',
        damageDealt: 0,
        damageTaken: 0,
        healingReceived: 0,
        kills: 0,
        deaths: 0,
      });
    }
    return statsMap.get(id)!;
  };

  for (const ev of session.events) {
    switch (ev.type) {
      case 'health_update': {
        if (ev.actorId === undefined || ev.damage === undefined) break;
        const receiver = getOrCreate(ev.actorId);
        if (ev.damage < 0) {
          receiver.damageTaken += Math.abs(ev.damage);
          // causerID = targetId
          if (ev.targetId !== undefined && ev.targetId !== ev.actorId) {
            const dealer = getOrCreate(ev.targetId);
            dealer.damageDealt += Math.abs(ev.damage);
          }
        } else if (ev.damage > 0) {
          receiver.healingReceived += ev.damage;
        }
        break;
      }
      case 'health_updates': {
        if (ev.actorId === undefined || ev.damage === undefined) break;
        const receiver = getOrCreate(ev.actorId);
        if (ev.damage < 0) {
          receiver.damageTaken += Math.abs(ev.damage);
        } else if (ev.damage > 0) {
          receiver.healingReceived += ev.damage;
        }
        break;
      }
      case 'kill': {
        if (ev.actorId !== undefined) getOrCreate(ev.actorId).kills += 1;
        if (ev.targetId !== undefined) getOrCreate(ev.targetId).deaths += 1;
        break;
      }
    }
  }

  return Array.from(statsMap.values()).filter(s =>
    s.damageDealt > 0 || s.damageTaken > 0 || s.healingReceived > 0 || s.kills > 0 || s.deaths > 0
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

type SortKey = keyof Pick<PlayerStats, 'damageDealt' | 'damageTaken' | 'healingReceived' | 'kills' | 'deaths'>;

const COLUMNS: { key: SortKey; label: string; color: string }[] = [
  { key: 'damageDealt',     label: '输出伤害',   color: 'text-orange-400' },
  { key: 'damageTaken',     label: '承受伤害',   color: 'text-red-400' },
  { key: 'healingReceived', label: '治疗量',     color: 'text-green-400' },
  { key: 'kills',           label: '击杀',       color: 'text-yellow-400' },
  { key: 'deaths',          label: '死亡',       color: 'text-zinc-500' },
];

export const StatsPanel: React.FC = () => {
  const session = useBattleStore(s => s.session);
  const filters = useBattleStore(s => s.filters);
  const [sortKey, setSortKey] = useState<SortKey>('damageDealt');
  const [sortDesc, setSortDesc] = useState(true);

  const stats = useMemo(() => {
    if (!session) return [];
    return computeStats(session);
  }, [session]);

  // 与左侧过滤器联动：公会过滤 + 玩家名搜索
  const filtered = useMemo(() => {
    return stats.filter(s => {
      if (filters.guilds.size > 0 && !filters.guilds.has(s.guildName)) return false;
      if (filters.playerName) {
        const q = filters.playerName.toLowerCase();
        if (!s.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [stats, filters.guilds, filters.playerName]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => sortDesc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]),
    [filtered, sortKey, sortDesc]
  );

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDesc(v => !v);
    else { setSortKey(key); setSortDesc(true); }
  };

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
        请先加载战斗日志
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
        暂无伤害数据
      </div>
    );
  }

  const maxDealt = Math.max(...sorted.map(s => s.damageDealt), 1);

  return (
    <div className="flex-1 overflow-auto px-4 py-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-2 pr-4 text-xs uppercase tracking-wider text-zinc-500 font-medium w-8">#</th>
            <th className="text-left py-2 pr-4 text-xs uppercase tracking-wider text-zinc-500 font-medium">玩家</th>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="text-right py-2 px-3 text-xs uppercase tracking-wider text-zinc-500 font-medium cursor-pointer hover:text-zinc-300 transition-colors select-none whitespace-nowrap"
              >
                <span className="flex items-center justify-end gap-1">
                  {col.label}
                  {sortKey === col.key
                    ? sortDesc ? <ChevronDown size={12} /> : <ChevronUp size={12} />
                    : <ChevronDown size={12} className="opacity-20" />
                  }
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => (
            <tr key={s.objectId} className="border-b border-zinc-800/40 hover:bg-zinc-900/50 transition-colors">
              <td className="py-2 pr-4 font-mono text-zinc-600 text-xs">{i + 1}</td>
              <td className="py-2 pr-4">
                <div className="space-y-0.5">
                  <div className="text-zinc-100 font-medium text-sm">{s.name}</div>
                  {s.guildName && (
                    <div className="text-xs text-zinc-500">{s.guildName}</div>
                  )}
                  {/* 伤害条 */}
                  <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-orange-500/70 rounded-full"
                      style={{ width: `${(s.damageDealt / maxDealt) * 100}%` }}
                    />
                  </div>
                </div>
              </td>
              {COLUMNS.map(col => (
                <td key={col.key} className={`py-2 px-3 text-right font-mono text-sm ${col.color}`}>
                  {col.key === 'kills' || col.key === 'deaths'
                    ? s[col.key]
                    : fmt(s[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
