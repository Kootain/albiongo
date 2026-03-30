import type { AoeZone, BattleEvent, SpellSequence } from '../types';

// ─── 内部状态机类型 ───────────────────────────────────────────────────────────────

interface PendingCast {
  actorId: number;
  actorName: string;
  spellIndex: number;
  castStartTs: number;
  castStartEvent: BattleEvent;
  castEndEvent?: BattleEvent;
  castSpellEvent?: BattleEvent;
  castEndTs?: number;
  spellId?: number;
}

interface HitBufEntry {
  casterObjectId: number;
  spellIndex: number;
  ts: number;
}

interface AoeBufEntry {
  casterObjectId: number;
  spellId: number;
  startTs: number;
  endTs: number;
  eventId: number;
  ts: number; // 事件到达时间（用于时间窗口匹配）
}

// ─── 辅助函数 ─────────────────────────────────────────────────────────────────────

/**
 * 在已完成序列中查找可关联的序列。
 * 匹配条件：actorId 相同，且 ts 落在 [seq.castStartTs, seq.castStartTs + windowMs]
 */
function findSeqByActorAndSpell(
  seqs: SpellSequence[],
  actorId: number,
  spellIndex: number,
  ts: number,
  windowMs: number,
): SpellSequence | null {
  let best: SpellSequence | null = null;
  let bestDiff = Infinity;
  for (const seq of seqs) {
    if (seq.actorId !== actorId || seq.spellIndex !== spellIndex) continue;
    const diff = ts - seq.castStartTs;
    if (diff >= 0 && diff <= windowMs && diff < bestDiff) {
      best = seq;
      bestDiff = diff;
    }
  }
  return best;
}

/**
 * 在已完成序列中通过 spellId 查找（用于 AoE 关联）。
 * 匹配条件：actorId 相同，spellId 相同，且 ts 与序列完成时间差 < windowMs
 */
function findSeqByActorAndSpellId(
  seqs: SpellSequence[],
  actorId: number,
  spellId: number,
  ts: number,
  windowMs: number,
): SpellSequence | null {
  let best: SpellSequence | null = null;
  let bestDiff = Infinity;
  for (const seq of seqs) {
    if (seq.actorId !== actorId || seq.spellId !== spellId) continue;
    const diff = Math.abs(ts - seq.castEndTs);
    if (diff <= windowMs && diff < bestDiff) {
      best = seq;
      bestDiff = diff;
    }
  }
  return best;
}

/**
 * 在已完成序列中查找同玩家最近的成功序列（用于 channeling_ended 关联）。
 */
function findRecentSuccessSeq(
  seqs: SpellSequence[],
  actorId: number,
  ts: number,
  windowMs: number,
): SpellSequence | null {
  let best: SpellSequence | null = null;
  let bestDiff = Infinity;
  for (const seq of seqs) {
    if (seq.actorId !== actorId || seq.outcome !== 'success') continue;
    const diff = ts - seq.castEndTs;
    if (diff >= 0 && diff <= windowMs && diff < bestDiff) {
      best = seq;
      bestDiff = diff;
    }
  }
  return best;
}

/** 将 PendingCast 输出为 SpellSequence */
function flushPending(
  pending: PendingCast,
  outcome: SpellSequence['outcome'],
): SpellSequence {
  return {
    id: `${pending.actorId}_${pending.spellIndex}_${pending.castStartTs}`,
    actorId: pending.actorId,
    actorName: pending.actorName,
    spellIndex: pending.spellIndex,
    spellId: pending.spellId,
    castStartTs: pending.castStartTs,
    castEndTs: pending.castEndTs ?? pending.castStartTs,
    outcome,
    hitCount: 0,
    aoeZones: [],
    castStartEvent: pending.castStartEvent,
    castEndEvent: pending.castEndEvent,
    castSpellEvent: pending.castSpellEvent,
  };
}

// ─── 主函数 ───────────────────────────────────────────────────────────────────────

/**
 * 将有序的 BattleEvent[] 聚合为 SpellSequence[]。
 * 纯函数，无副作用，无 Canvas/React 依赖。
 */
export function buildSpellSequences(events: BattleEvent[]): SpellSequence[] {
  // 每位玩家每个技能槽位最多一个进行中的施法
  const pendingCasts = new Map<string, PendingCast>();
  const completedSeqs: SpellSequence[] = [];

  // 暂存尚未关联到序列的 cast_hit 和 spell_effect_area 事件
  const hitBuf: HitBufEntry[] = [];
  const aoeBuf: AoeBufEntry[] = [];

  for (const e of events) {
    const raw = e.raw;

    switch (e.type) {
      case 'cast_start': {
        if (e.actorId === undefined) break;
        const spellIndex = raw.SpellIndex ?? 0;
        const key = `${e.actorId}_${spellIndex}`;
        pendingCasts.set(key, {
          actorId: e.actorId,
          actorName: e.actorName ?? '',
          spellIndex,
          castStartTs: e.ts,
          castStartEvent: e,
        });
        break;
      }

      case 'cast_finished': {
        // CasterObjectID + SpellIndex（cast_finished 用 CasterObjectID）
        const casterId = raw.CasterObjectID ?? raw.ObjectID;
        if (casterId === undefined) break;
        const spellIndex = raw.SpellIndex ?? 0;
        const key = `${casterId}_${spellIndex}`;
        const pending = pendingCasts.get(key);
        if (pending) {
          pending.castEndEvent = e;
          pending.castEndTs = e.ts;
          pending.spellId = raw.SpellID ?? pending.spellId;
        }
        break;
      }

      case 'cast_cancel': {
        if (e.actorId === undefined) break;
        const spellIndex = raw.SpellIndex ?? 0;
        const key = `${e.actorId}_${spellIndex}`;
        const pending = pendingCasts.get(key);
        if (pending) {
          pending.castEndEvent = e;
          pending.castEndTs = e.ts;
          const outcome = raw.IsInterupted ? 'interrupted' : 'cancelled';
          const seq = flushPending(pending, outcome);
          completedSeqs.push(seq);
          pendingCasts.delete(key);

          // 尝试消化 hitBuf 中已缓存的 cast_hit
          drainHitBuf(hitBuf, seq);
          drainAoeBuf(aoeBuf, seq);
        }
        break;
      }

      case 'cast_spell': {
        const casterId = raw.CasterObjectID ?? e.actorId;
        if (casterId === undefined) break;
        const spellIndex = raw.SpellIndex ?? 0;
        const key = `${casterId}_${spellIndex}`;
        const pending = pendingCasts.get(key);
        if (pending) {
          pending.castSpellEvent = e;
          pending.spellId = raw.SpellID ?? pending.spellId;
          // cast_finished 可能在 cast_spell 之前到达（协议顺序）
          if (!pending.castEndTs) {
            pending.castEndTs = e.ts;
            pending.castEndEvent = e;
          }
          const seq = flushPending(pending, 'success');
          completedSeqs.push(seq);
          pendingCasts.delete(key);

          drainHitBuf(hitBuf, seq);
          drainAoeBuf(aoeBuf, seq);
        }
        break;
      }

      case 'channeling_ended': {
        if (e.actorId === undefined) break;
        const seq = findRecentSuccessSeq(completedSeqs, e.actorId, e.ts, 5000);
        if (seq) seq.channelingEndTs = e.ts;
        break;
      }

      case 'cast_hit': {
        const casterId = raw.CasterObjectID ?? raw.ObjectID1;
        if (casterId === undefined) break;
        const spellIndex = raw.SpellIndex ?? 0;
        const seq = findSeqByActorAndSpell(completedSeqs, casterId, spellIndex, e.ts, 5000);
        if (seq) {
          seq.hitCount++;
        } else {
          hitBuf.push({ casterObjectId: casterId, spellIndex, ts: e.ts });
        }
        break;
      }

      case 'spell_effect_area': {
        const casterId = raw.CasterObjectID;
        const spellId = raw.SpellID ?? e.spellId;
        if (casterId === undefined || spellId === undefined) break;

        const startTs = raw.StartTimestamp ?? e.ts;
        const endTs = raw.EndTimestamp ?? e.ts;
        const eventId = raw.EventID ?? 0;

        const seq = findSeqByActorAndSpellId(completedSeqs, casterId, spellId, e.ts, 500);
        if (seq) {
          seq.aoeZones.push({ eventId, startTs, endTs, spellId });
        } else {
          aoeBuf.push({ casterObjectId: casterId, spellId, startTs, endTs, eventId, ts: e.ts });
        }
        break;
      }

      default:
        break;
    }
  }

  // 将仍在进行的 pending cast（live 模式）以 unknown 状态输出
  for (const pending of pendingCasts.values()) {
    completedSeqs.push(flushPending(pending, 'unknown'));
  }

  return completedSeqs.sort((a, b) => a.castStartTs - b.castStartTs);
}

// ─── 缓冲区消化辅助 ───────────────────────────────────────────────────────────────

function drainHitBuf(hitBuf: HitBufEntry[], seq: SpellSequence): void {
  for (let i = hitBuf.length - 1; i >= 0; i--) {
    const h = hitBuf[i];
    if (
      h.casterObjectId === seq.actorId &&
      h.spellIndex === seq.spellIndex &&
      h.ts >= seq.castStartTs &&
      h.ts <= seq.castStartTs + 5000
    ) {
      seq.hitCount++;
      hitBuf.splice(i, 1);
    }
  }
}

function drainAoeBuf(aoeBuf: AoeBufEntry[], seq: SpellSequence): void {
  if (seq.spellId === undefined) return;
  for (let i = aoeBuf.length - 1; i >= 0; i--) {
    const a = aoeBuf[i];
    if (
      a.casterObjectId === seq.actorId &&
      a.spellId === seq.spellId &&
      Math.abs(a.ts - seq.castEndTs) <= 500
    ) {
      const zone: AoeZone = {
        eventId: a.eventId,
        startTs: a.startTs,
        endTs: a.endTs,
        spellId: a.spellId,
      };
      seq.aoeZones.push(zone);
      aoeBuf.splice(i, 1);
    }
  }
}
