import { getItemName, getSpellName } from '@albion/game-data';
import { X } from 'lucide-react';
import React from 'react';
import { useBattleStore } from '../store/useBattleStore';
import { useTimelineStore } from '../store/useTimelineStore';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, type BattleEvent, type EventType, type SpellSequence } from '../types';

// ── 工具函数 ──────────────────────────────────────────────────────────────────

function formatTs(ts: number, startTs: number): string {
  const elapsed  = ts - startTs;
  const totalSec = Math.floor(elapsed / 1000);
  const ms = elapsed % 1000;
  const m  = Math.floor(totalSec / 60);
  const s  = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function formatAbsoluteTs(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false });
}

// SpellIndex / SpellID 均为直接 DB ID，直接查 SDK
function resolveSpell(spellId: number | undefined): string | undefined {
  if (spellId === undefined || spellId < 0) return undefined;
  const name = getSpellName(spellId);
  return name || undefined;
}

// ── 语义化标签 ────────────────────────────────────────────────────────────────

function actorLabel(type: EventType): string {
  switch (type) {
    case 'cast_spell': case 'cast_start': case 'cast_finished':
    case 'cast_hit':   case 'cast_hits':  case 'spell_effect_area':
      return '施法者';
    case 'attack':          return '攻击者';
    case 'health_update':   return '受击者';
    case 'forced_movement': return '施法方';
    case 'kill':            return '凶手';
    default:                return '玩家';
  }
}

function targetLabel(type: EventType): string {
  switch (type) {
    case 'cast_hit':        return '命中者';
    case 'forced_movement': return '被位移';
    case 'health_update':   return '来源';
    case 'kill':            return '死者';
    default:                return '目标';
  }
}

// ── 子组件 ────────────────────────────────────────────────────────────────────

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start gap-2 py-2 border-b border-zinc-800/60 last:border-0">
    <span className="text-xs uppercase tracking-wider text-zinc-500 w-16 flex-shrink-0 pt-0.5">{label}</span>
    <span className="text-sm text-zinc-200 font-mono break-all flex-1">{value}</span>
  </div>
);

const PlayerBadge: React.FC<{ name?: string; guild?: string; alliance?: string }> = ({ name, guild, alliance }) => {
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
  const [copied,   setCopied]   = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {expanded ? '▾ 收起原始数据' : '▸ 展开原始数据'}
        </button>
        <button
          onClick={handleCopy}
          className="text-xs text-zinc-600 hover:text-indigo-400 transition-colors ml-auto"
        >
          {copied ? '✓ 已复制' : '复制'}
        </button>
      </div>
      {expanded && (
        <pre className="mt-2 text-xs text-zinc-400 bg-zinc-950 rounded-lg p-3 overflow-x-auto border border-zinc-800">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

// ── 施法序列详情 ──────────────────────────────────────────────────────────────

const OUTCOME_LABELS: Record<SpellSequence['outcome'], { label: string; color: string }> = {
  success:     { label: '成功',   color: 'text-green-400' },
  interrupted: { label: '被打断', color: 'text-red-400' },
  cancelled:   { label: '取消',   color: 'text-zinc-500' },
  unknown:     { label: '进行中', color: 'text-zinc-400' },
};

const SpellSequenceDetail: React.FC<{ seq: SpellSequence; startTs: number }> = ({ seq, startTs }) => {
  const spellName = resolveSpell(seq.spellId);
  const outcome   = OUTCOME_LABELS[seq.outcome];
  const castDuration = seq.castEndTs - seq.castStartTs;
  const channelingDuration =
    seq.channelingEndTs !== undefined && seq.castSpellEvent
      ? seq.channelingEndTs - seq.castSpellEvent.ts
      : undefined;

  return (
    <div className="space-y-0">
      {/* 施法者 */}
      <Row label="施法者" value={<PlayerBadge name={seq.actorName} />} />

      {/* 技能 */}
      {spellName
        ? <Row label="技能" value={spellName} />
        : seq.spellId !== undefined && <Row label="技能 ID" value={String(seq.spellId)} />
      }

      {/* 施法结果 */}
      <Row
        label="结果"
        value={<span className={outcome.color}>{outcome.label}</span>}
      />

      {/* 施法时长 */}
      <Row label="施法时长" value={`${castDuration} ms`} />

      {/* 开始时间 */}
      <Row label="开始" value={`${formatTs(seq.castStartTs, startTs)} (${formatAbsoluteTs(seq.castStartTs)})`} />

      {/* 命中数 */}
      <Row
        label="命中"
        value={
          <span className={seq.hitCount > 0 ? 'text-indigo-400' : 'text-zinc-500'}>
            {seq.hitCount} 次
          </span>
        }
      />

      {/* 吟唱时长 */}
      {channelingDuration !== undefined && (
        <Row label="吟唱时长" value={`${channelingDuration} ms`} />
      )}

      {/* AoE 区域 */}
      {seq.aoeZones.length > 0 && (
        <Row
          label="AoE 区域"
          value={
            <div className="space-y-1">
              <span className="text-zinc-400">{seq.aoeZones.length} 个区域</span>
              {seq.aoeZones.map((z, i) => (
                <div key={z.eventId} className="text-xs text-zinc-500">
                  #{i + 1}：{z.endTs - z.startTs} ms
                </div>
              ))}
            </div>
          }
        />
      )}

      {/* 原始事件（可折叠） */}
      <div className="pt-2">
        <RawDataView data={seq.castStartEvent.raw} />
      </div>
    </div>
  );
};

// ── 事件详情内容 ──────────────────────────────────────────────────────────────

const EventDetail: React.FC<{ event: BattleEvent; startTs: number }> = ({ event, startTs }) => {
  const spellName = resolveSpell(event.spellId);
  const aLabel    = actorLabel(event.type);
  const tLabel    = targetLabel(event.type);

  const castHitsCount = event.type === 'cast_hits'
    ? (event.raw.TargetObjectIDs?.length ?? null)
    : null;

  const attackResult = event.type === 'attack' && event.raw.Result !== undefined
    ? (event.raw.Result === 0 ? '命中' : '格挡/闪避')
    : null;

  return (
    <div className="space-y-0">
      {/* 类型 */}
      <Row
        label="类型"
        value={
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: EVENT_TYPE_COLORS[event.type] }} />
            {EVENT_TYPE_LABELS[event.type]}
          </span>
        }
      />

      {/* 时间 */}
      <Row label="时间" value={`${formatTs(event.ts, startTs)} (${formatAbsoluteTs(event.ts)})`} />

      {/* actor */}
      {event.actorName && (
        <Row
          label={aLabel}
          value={<PlayerBadge name={event.actorName} guild={event.actorGuild} alliance={event.actorAlliance} />}
        />
      )}

      {/* target */}
      {event.targetName && (
        <Row
          label={tLabel}
          value={<PlayerBadge name={event.targetName} guild={event.targetGuild} />}
        />
      )}

      {/* 技能 */}
      {spellName && <Row label="技能" value={spellName} />}

      {/* cast_hits：目标数 */}
      {castHitsCount !== null && (
        <Row label="命中数" value={<span className="text-indigo-400">{castHitsCount} 人</span>} />
      )}

      {/* attack：结果 */}
      {attackResult !== null && (
        <Row label="结果" value={
          <span className={attackResult === '命中' ? 'text-green-400' : 'text-zinc-500'}>
            {attackResult}
          </span>
        } />
      )}

      {/* 伤害/治疗 */}
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

      {/* health_update：当前血量 */}
      {event.type === 'health_update' && event.currentHealth !== undefined && (
        <Row label="当前血量" value={<span className="text-zinc-300">{event.currentHealth.toFixed(0)}</span>} />
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

      {/* 装备 */}
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

// ── 抽屉容器 ──────────────────────────────────────────────────────────────────

export const EventDrawer: React.FC = () => {
  const selectedEvent    = useTimelineStore(s => s.selectedEvent);
  const selectedSequence = useTimelineStore(s => s.selectedSequence);
  const selectEvent      = useTimelineStore(s => s.selectEvent);
  const selectSequence   = useTimelineStore(s => s.selectSequence);
  const session          = useBattleStore(s => s.session);

  const isOpen = selectedSequence !== null || selectedEvent !== null;

  const handleClose = () => {
    selectSequence(null);
    selectEvent(null);
  };

  return (
    <div
      className={`
        flex-shrink-0 flex flex-col bg-zinc-900 border-l border-zinc-800
        transition-all duration-200 overflow-hidden
        ${isOpen ? 'w-72' : 'w-0 border-l-0'}
      `}
    >
      {isOpen && (
        <>
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
            <span className="text-sm font-semibold text-zinc-100">
              {selectedSequence ? '施法序列详情' : '事件详情'}
            </span>
            <button
              onClick={handleClose}
              className="p-1 text-zinc-500 hover:text-red-400 transition-colors rounded"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {selectedSequence ? (
              <SpellSequenceDetail seq={selectedSequence} startTs={session?.startTs ?? 0} />
            ) : selectedEvent ? (
              <EventDetail event={selectedEvent} startTs={session?.startTs ?? 0} />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};
