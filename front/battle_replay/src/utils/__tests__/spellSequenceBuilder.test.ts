import { describe, expect, it } from 'vitest';
import type { BattleEvent, RawLogEntry } from '../../types';
import { buildSpellSequences } from '../spellSequenceBuilder';

// ─── 测试辅助 ─────────────────────────────────────────────────────────────────────

let _id = 0;
function makeEvent(
  type: BattleEvent['type'],
  ts: number,
  raw: Partial<RawLogEntry>,
): BattleEvent {
  const actorId = (raw.ObjectID ?? raw.CasterObjectID ?? 0) as number;
  return {
    id: String(++_id),
    ts,
    type,
    actorId,
    actorName: raw.Name ?? `P${actorId}`,
    raw: { Type: 0, Code: 0, Ts: ts, ...raw } as RawLogEntry,
  };
}

// ─── 场景 1：成功施法（cast_start → cast_finished → cast_spell） ──────────────────

describe('成功施法序列', () => {
  it('应输出 outcome=success 的序列', () => {
    const events: BattleEvent[] = [
      makeEvent('cast_start',    1000, { ObjectID: 1, Name: 'Alice', SpellIndex: 3 }),
      makeEvent('cast_finished', 1500, { CasterObjectID: 1, SpellIndex: 3, SpellID: 999 }),
      makeEvent('cast_spell',    1500, { CasterObjectID: 1, SpellIndex: 3, SpellID: 999 }),
    ];
    const seqs = buildSpellSequences(events);
    expect(seqs).toHaveLength(1);
    expect(seqs[0].outcome).toBe('success');
    expect(seqs[0].actorId).toBe(1);
    expect(seqs[0].spellIndex).toBe(3);
    expect(seqs[0].spellId).toBe(999);
    expect(seqs[0].castStartTs).toBe(1000);
    expect(seqs[0].castEndTs).toBe(1500);
  });

  it('应关联 cast_hit 事件（hitCount++）', () => {
    const events: BattleEvent[] = [
      makeEvent('cast_start',    1000, { ObjectID: 1, SpellIndex: 3 }),
      makeEvent('cast_spell',    1500, { CasterObjectID: 1, SpellIndex: 3, SpellID: 999 }),
      makeEvent('cast_hit',      1600, { CasterObjectID: 1, SpellIndex: 3 }),
      makeEvent('cast_hit',      1700, { CasterObjectID: 1, SpellIndex: 3 }),
    ];
    const seqs = buildSpellSequences(events);
    expect(seqs[0].hitCount).toBe(2);
  });

  it('cast_hit 超出 5s 时间窗口不关联', () => {
    const events: BattleEvent[] = [
      makeEvent('cast_start',    1000, { ObjectID: 1, SpellIndex: 3 }),
      makeEvent('cast_spell',    1500, { CasterObjectID: 1, SpellIndex: 3, SpellID: 999 }),
      makeEvent('cast_hit',      7000, { CasterObjectID: 1, SpellIndex: 3 }), // 超出 5s
    ];
    const seqs = buildSpellSequences(events);
    expect(seqs[0].hitCount).toBe(0);
  });
});

// ─── 场景 2：被打断（cast_start → cast_cancel，IsInterupted=true） ─────────────────

describe('被打断施法序列', () => {
  it('应输出 outcome=interrupted 的序列', () => {
    const events: BattleEvent[] = [
      makeEvent('cast_start',  2000, { ObjectID: 2, Name: 'Bob', SpellIndex: 1 }),
      makeEvent('cast_cancel', 2300, { ObjectID: 2, Name: 'Bob', SpellIndex: 1, IsInterupted: true }),
    ];
    const seqs = buildSpellSequences(events);
    expect(seqs).toHaveLength(1);
    expect(seqs[0].outcome).toBe('interrupted');
    expect(seqs[0].castEndTs).toBe(2300);
  });
});

// ─── 场景 3：主动取消（cast_start → cast_cancel，IsInterupted=false） ────────────────

describe('主动取消施法序列', () => {
  it('应输出 outcome=cancelled 的序列', () => {
    const events: BattleEvent[] = [
      makeEvent('cast_start',  3000, { ObjectID: 3, SpellIndex: 2 }),
      makeEvent('cast_cancel', 3200, { ObjectID: 3, SpellIndex: 2, IsInterupted: false }),
    ];
    const seqs = buildSpellSequences(events);
    expect(seqs).toHaveLength(1);
    expect(seqs[0].outcome).toBe('cancelled');
  });
});

// ─── 场景 4：吟唱阶段（cast_spell → channeling_ended） ───────────────────────────

describe('吟唱施法序列', () => {
  it('应在成功序列上设置 channelingEndTs', () => {
    const events: BattleEvent[] = [
      makeEvent('cast_start',       4000, { ObjectID: 4, SpellIndex: 0 }),
      makeEvent('cast_spell',       4500, { CasterObjectID: 4, SpellIndex: 0, SpellID: 777 }),
      makeEvent('channeling_ended', 6000, { ObjectID: 4 }),
    ];
    const seqs = buildSpellSequences(events);
    expect(seqs).toHaveLength(1);
    expect(seqs[0].outcome).toBe('success');
    expect(seqs[0].channelingEndTs).toBe(6000);
  });

  it('channeling_ended 超出 5s 窗口不关联', () => {
    const events: BattleEvent[] = [
      makeEvent('cast_start',       4000, { ObjectID: 4, SpellIndex: 0 }),
      makeEvent('cast_spell',       4500, { CasterObjectID: 4, SpellIndex: 0, SpellID: 777 }),
      makeEvent('channeling_ended', 10000, { ObjectID: 4 }), // 超出 5s
    ];
    const seqs = buildSpellSequences(events);
    expect(seqs[0].channelingEndTs).toBeUndefined();
  });
});

// ─── 场景 5：AoE 关联 ─────────────────────────────────────────────────────────────

describe('AoE 关联', () => {
  it('应将 spell_effect_area 关联到对应序列', () => {
    const events: BattleEvent[] = [
      makeEvent('cast_start',        5000, { ObjectID: 5, SpellIndex: 2 }),
      makeEvent('cast_spell',        5500, { CasterObjectID: 5, SpellIndex: 2, SpellID: 500 }),
      makeEvent('spell_effect_area', 5600, {
        CasterObjectID: 5,
        SpellID: 500,
        EventID: 42,
        StartTimestamp: 5600,
        EndTimestamp: 8600,
      }),
    ];
    const seqs = buildSpellSequences(events);
    expect(seqs[0].aoeZones).toHaveLength(1);
    expect(seqs[0].aoeZones[0].eventId).toBe(42);
    expect(seqs[0].aoeZones[0].endTs).toBe(8600);
  });
});

// ─── 场景 6：多玩家互不干扰 ───────────────────────────────────────────────────────

describe('多玩家序列隔离', () => {
  it('不同 actorId 的序列应独立输出', () => {
    const events: BattleEvent[] = [
      makeEvent('cast_start', 1000, { ObjectID: 10, SpellIndex: 0 }),
      makeEvent('cast_start', 1100, { ObjectID: 20, SpellIndex: 0 }),
      makeEvent('cast_spell', 1500, { CasterObjectID: 10, SpellIndex: 0, SpellID: 1 }),
      makeEvent('cast_spell', 1600, { CasterObjectID: 20, SpellIndex: 0, SpellID: 2 }),
    ];
    const seqs = buildSpellSequences(events);
    expect(seqs).toHaveLength(2);
    const ids = seqs.map(s => s.actorId).sort();
    expect(ids).toEqual([10, 20]);
  });
});

// ─── 场景 7：live 模式未完成的序列输出为 unknown ─────────────────────────────────

describe('live 模式 - 未完成序列', () => {
  it('仅有 cast_start 时输出 outcome=unknown', () => {
    const events: BattleEvent[] = [
      makeEvent('cast_start', 9000, { ObjectID: 99, SpellIndex: 1 }),
    ];
    const seqs = buildSpellSequences(events);
    expect(seqs).toHaveLength(1);
    expect(seqs[0].outcome).toBe('unknown');
  });
});
