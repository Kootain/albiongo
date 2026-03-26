import { getItemName, getSpellName } from '@albion/game-data';
import { X } from 'lucide-react';
import React from 'react';
import { useBattleStore } from '../store/useBattleStore';
import { useTimelineStore } from '../store/useTimelineStore';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, type BattleEvent, type BattleSession } from '../types';

function formatTs(ts: number, startTs: number): string {
  const elapsed = ts - startTs;
  const totalSec = Math.floor(elapsed / 1000);
  const ms = elapsed % 1000;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function formatAbsoluteTs(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false });
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start gap-2 py-2 border-b border-zinc-800/60 last:border-0">
    <span className="text-xs uppercase tracking-wider text-zinc-500 w-16 flex-shrink-0 pt-0.5">{label}</span>
    <span className="text-sm text-zinc-200 font-mono break-all flex-1">{value}</span>
  </div>
);

const PlayerBadge: React.FC<{ name?: string; guild?: string; alliance?: string }> = ({
  name, guild, alliance,
}) => {
  if (!name) return <span className="text-zinc-600">—</span>;
  return (
    <div className="space-y-0.5">
      <div className="text-zinc-100">{name}</div>
      {guild && <div className="text-xs text-zinc-500">{guild}{alliance ? ` · ${alliance}` : ''}</div>}
    </div>
  );
};

const RawDataView: React.FC<{ data: unknown }> = ({ data }) => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(v => !v)}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        {expanded ? '▾ 收起原始数据' : '▸ 展开原始数据'}
      </button>
      {expanded && (
        <pre className="mt-2 text-xs text-zinc-400 bg-zinc-950 rounded-lg p-3 overflow-x-auto border border-zinc-800">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

function resolveSpellLabel(event: BattleEvent, session: BattleSession | null): string | undefined {
  if (event.spellId === undefined) return undefined;

  // 通过玩家档案将插槽索引 → 真实 spell DB ID
  if (event.actorId !== undefined && session) {
    const profile = session.players[event.actorId];
    if (profile?.spellIds?.length) {
      const realId = profile.spellIds[event.spellId];
      if (realId !== undefined) return getSpellName(realId, `#${realId}`);
    }
  }
  // cast_finished / forced_movement / spell_effect_area 的 spellId 是直接 DB ID
  const directName = getSpellName(event.spellId);
  if (directName) return directName;
  return `#${event.spellId}`;
}

const EventDetail: React.FC<{ event: BattleEvent; startTs: number; session: BattleSession | null }> = ({ event, startTs, session }) => {
  const spellLabel = resolveSpellLabel(event, session);

  return (
    <div className="space-y-0">
      <Row
        label="类型"
        value={
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: EVENT_TYPE_COLORS[event.type] }} />
            {EVENT_TYPE_LABELS[event.type]}
          </span>
        }
      />
      <Row label="时间" value={`${formatTs(event.ts, startTs)} (${formatAbsoluteTs(event.ts)})`} />

      {/* 击杀事件：凶手 → 受害者 */}
      {event.type === 'kill' ? (
        <>
          <Row label="凶手" value={<PlayerBadge name={event.actorName} guild={event.actorGuild} />} />
          <Row label="死者" value={<PlayerBadge name={event.targetName} guild={event.targetGuild} />} />
        </>
      ) : (
        <>
          {event.actorName && (
            <Row label="来源" value={<PlayerBadge name={event.actorName} guild={event.actorGuild} alliance={event.actorAlliance} />} />
          )}
          {event.targetName && (
            <Row label="目标" value={<PlayerBadge name={event.targetName} guild={event.targetGuild} />} />
          )}
        </>
      )}

      {spellLabel !== undefined && <Row label="技能" value={spellLabel} />}

      {/* 伤害量 */}
      {event.damage !== undefined && event.type !== 'energy_update' && (
        <Row
          label="伤害"
          value={
            <span className={event.damage < 0 ? 'text-red-400' : 'text-green-400'}>
              {event.damage < 0 ? event.damage.toFixed(0) : `+${event.damage.toFixed(0)}`}
            </span>
          }
        />
      )}

      {/* 能量变化 */}
      {event.type === 'energy_update' && event.damage !== undefined && (
        <Row label="能量" value={
          <span className={event.damage < 0 ? 'text-blue-300' : 'text-blue-500'}>
            {event.damage < 0 ? event.damage.toFixed(0) : `+${event.damage.toFixed(0)}`}
            {event.currentHealth !== undefined ? ` → ${event.currentHealth.toFixed(0)}` : ''}
          </span>
        } />
      )}

      {/* 坐骑 */}
      {event.mountItemId !== undefined && (
        <Row label="坐骑" value={getItemName(event.mountItemId, `#${event.mountItemId}`)} />
      )}

      {/* 装备列表 */}
      {event.equipmentIds && event.equipmentIds.length > 0 && (
        <Row
          label="装备"
          value={
            <div className="flex flex-wrap gap-1">
              {event.equipmentIds.filter(Boolean).map((id, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs" title={String(id)}>
                  {getItemName(id, String(id))}
                </span>
              ))}
            </div>
          }
        />
      )}

      <div className="pt-2">
        <RawDataView data={event.raw} />
      </div>
    </div>
  );
};

export const EventDrawer: React.FC = () => {
  const selectedEvent = useTimelineStore(s => s.selectedEvent);
  const selectEvent = useTimelineStore(s => s.selectEvent);
  const session = useBattleStore(s => s.session);

  const isOpen = selectedEvent !== null;

  return (
    <div
      className={`
        flex-shrink-0 flex flex-col bg-zinc-900 border-l border-zinc-800
        transition-all duration-200 overflow-hidden
        ${isOpen ? 'w-72' : 'w-0 border-l-0'}
      `}
    >
      {isOpen && selectedEvent && (
        <>
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
            <span className="text-sm font-semibold text-zinc-100">事件详情</span>
            <button
              onClick={() => selectEvent(null)}
              className="p-1 text-zinc-500 hover:text-red-400 transition-colors rounded"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <EventDetail event={selectedEvent} startTs={session?.startTs ?? 0} session={session} />
          </div>
        </>
      )}
    </div>
  );
};

