import { describe, expect, it } from 'vitest';
import type { SpellSequence, TimelineViewport } from '../../../types';
import type { HitEntry, RowHeightConfig } from '../layout';
import {
  computeContentHeight,
  computePlayerRows,
  getRowHeight,
  hitTest,
  tsToX,
} from '../layout';

// ─── 测试辅助 ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: RowHeightConfig = {
  minHeight: 28,
  castBarH: 8,
  aoeBarH: 5,
  aoeMarginTop: 3,
  paddingV: 6,
};

const makeViewport = (startTs: number, endTs: number): TimelineViewport => ({
  startTs,
  endTs,
  scrollY: 0,
});

function makeSeq(partial: Partial<SpellSequence> & { actorId: number; castStartTs: number }): SpellSequence {
  return {
    id: `${partial.actorId}_0_${partial.castStartTs}`,
    actorName: partial.actorName ?? 'Player',
    spellIndex: 0,
    castEndTs: partial.castStartTs + 500,
    outcome: 'success',
    hitCount: 0,
    aoeZones: [],
    castStartEvent: {} as never,
    ...partial,
  } as SpellSequence;
}

// ─── tsToX ────────────────────────────────────────────────────────────────────────

describe('tsToX', () => {
  it('左边界时间戳映射到 labelWidth', () => {
    const vp = makeViewport(1000, 2000);
    expect(tsToX(1000, vp, 600, 120)).toBe(120);
  });

  it('右边界时间戳映射到 canvasWidth', () => {
    const vp = makeViewport(1000, 2000);
    expect(tsToX(2000, vp, 600, 120)).toBe(600);
  });

  it('中间时间戳映射到中间 X', () => {
    const vp = makeViewport(1000, 2000);
    // 时间线宽度 = 600 - 120 = 480，中间 = 120 + 240 = 360
    expect(tsToX(1500, vp, 600, 120)).toBe(360);
  });

  it('zoom 后（缩小 viewport）坐标扩展', () => {
    // viewport 只覆盖 100ms，时间线宽度 480px → 1ms = 4.8px
    const vp = makeViewport(1000, 1100);
    const x = tsToX(1050, vp, 600, 120);
    expect(x).toBeCloseTo(120 + 240, 5); // 480 * 0.5 + 120
  });

  it('span=0 时返回 labelWidth', () => {
    const vp = makeViewport(1000, 1000);
    expect(tsToX(1000, vp, 600, 120)).toBe(120);
  });
});

// ─── getRowHeight ─────────────────────────────────────────────────────────────────

describe('getRowHeight', () => {
  it('无 AoE 时返回 minHeight（不低于）', () => {
    const seqs = [makeSeq({ actorId: 1, castStartTs: 0 })];
    // paddingV*2 + castBarH = 6*2 + 8 = 20，但 minHeight=28
    expect(getRowHeight(seqs, DEFAULT_CONFIG)).toBe(28);
  });

  it('1 个 AoE 时行高增加', () => {
    const seqs = [
      makeSeq({
        actorId: 1,
        castStartTs: 0,
        aoeZones: [{ eventId: 1, startTs: 0, endTs: 1000, spellId: 1 }],
      }),
    ];
    const expected = Math.max(
      DEFAULT_CONFIG.paddingV * 2 + DEFAULT_CONFIG.castBarH + DEFAULT_CONFIG.aoeBarH + DEFAULT_CONFIG.aoeMarginTop,
      DEFAULT_CONFIG.minHeight,
    );
    expect(getRowHeight(seqs, DEFAULT_CONFIG)).toBe(expected);
  });

  it('3 个 AoE 时高度为 paddingV*2 + castBarH + 3*(aoeBarH+aoeMarginTop)', () => {
    const zones = [1, 2, 3].map(i => ({ eventId: i, startTs: 0, endTs: 1000, spellId: i }));
    const seqs = [makeSeq({ actorId: 1, castStartTs: 0, aoeZones: zones })];
    const expected =
      DEFAULT_CONFIG.paddingV * 2 +
      DEFAULT_CONFIG.castBarH +
      3 * (DEFAULT_CONFIG.aoeBarH + DEFAULT_CONFIG.aoeMarginTop);
    expect(getRowHeight(seqs, DEFAULT_CONFIG)).toBe(Math.max(expected, DEFAULT_CONFIG.minHeight));
  });

  it('空序列列表返回 minHeight', () => {
    expect(getRowHeight([], DEFAULT_CONFIG)).toBe(DEFAULT_CONFIG.minHeight);
  });

  it('多个序列取 AoE 数量最大值计算行高', () => {
    const seqs = [
      makeSeq({ actorId: 1, castStartTs: 0, aoeZones: [{ eventId: 1, startTs: 0, endTs: 1000, spellId: 1 }] }),
      makeSeq({ actorId: 1, castStartTs: 1000, aoeZones: [] }),
    ];
    // 最大 AoE 数量 = 1
    const h1 = getRowHeight([seqs[0]], DEFAULT_CONFIG);
    expect(getRowHeight(seqs, DEFAULT_CONFIG)).toBe(h1);
  });
});

// ─── computePlayerRows ────────────────────────────────────────────────────────────

describe('computePlayerRows', () => {
  it('单玩家，Y 从 headerHeight 开始', () => {
    const seqs = [makeSeq({ actorId: 1, castStartTs: 100 })];
    const rows = computePlayerRows(seqs, 0, 44, DEFAULT_CONFIG);
    expect(rows).toHaveLength(1);
    expect(rows[0].y).toBe(44);
    expect(rows[0].actorId).toBe(1);
  });

  it('两个玩家按首次 castStartTs 排序', () => {
    const seqs = [
      makeSeq({ actorId: 2, castStartTs: 200, actorName: 'B' }),
      makeSeq({ actorId: 1, castStartTs: 100, actorName: 'A' }),
    ];
    const rows = computePlayerRows(seqs, 0, 44, DEFAULT_CONFIG);
    expect(rows[0].actorId).toBe(1); // A 出现更早
    expect(rows[1].actorId).toBe(2);
  });

  it('scrollY 偏移正确应用到 y', () => {
    const seqs = [makeSeq({ actorId: 1, castStartTs: 100 })];
    const rows0 = computePlayerRows(seqs, 0, 44, DEFAULT_CONFIG);
    const rows10 = computePlayerRows(seqs, 10, 44, DEFAULT_CONFIG);
    expect(rows10[0].y).toBe(rows0[0].y - 10);
  });

  it('多序列属于同一玩家时合并到同一行', () => {
    const seqs = [
      makeSeq({ actorId: 1, castStartTs: 100 }),
      makeSeq({ actorId: 1, castStartTs: 200 }),
    ];
    const rows = computePlayerRows(seqs, 0, 44, DEFAULT_CONFIG);
    expect(rows).toHaveLength(1);
    expect(rows[0].sequences).toHaveLength(2);
  });

  it('第二行 y = 第一行 y + 第一行 height', () => {
    const seqs = [
      makeSeq({ actorId: 1, castStartTs: 100 }),
      makeSeq({ actorId: 2, castStartTs: 200 }),
    ];
    const rows = computePlayerRows(seqs, 0, 44, DEFAULT_CONFIG);
    expect(rows[1].y).toBe(rows[0].y + rows[0].height);
  });
});

// ─── hitTest ─────────────────────────────────────────────────────────────────────

describe('hitTest', () => {
  const seq1 = makeSeq({ actorId: 1, castStartTs: 100 });
  const seq2 = makeSeq({ actorId: 2, castStartTs: 200 });

  const entries: HitEntry[] = [
    { sequence: seq1, x: 100, y: 50, w: 80, h: 28 },
    { sequence: seq2, x: 300, y: 100, w: 60, h: 28 },
  ];

  it('点击第一个序列区域返回 seq1', () => {
    expect(hitTest(140, 60, entries)).toBe(seq1);
  });

  it('点击第二个序列区域返回 seq2', () => {
    expect(hitTest(330, 110, entries)).toBe(seq2);
  });

  it('点击空白区域返回 null', () => {
    expect(hitTest(200, 60, entries)).toBeNull();
  });

  it('边界点（左上角）命中', () => {
    expect(hitTest(100, 50, entries)).toBe(seq1);
  });

  it('边界点（右下角，含边界）命中', () => {
    expect(hitTest(180, 78, entries)).toBe(seq1);
  });

  it('空 entries 返回 null', () => {
    expect(hitTest(100, 100, [])).toBeNull();
  });
});

// ─── computeContentHeight ────────────────────────────────────────────────────────

describe('computeContentHeight', () => {
  it('空行时返回 headerHeight', () => {
    expect(computeContentHeight([], 44)).toBe(44);
  });

  it('总高度 = headerHeight + 所有行高之和', () => {
    const seqs1 = [makeSeq({ actorId: 1, castStartTs: 100 })];
    const seqs2 = [makeSeq({ actorId: 2, castStartTs: 200 })];
    const rows = computePlayerRows([...seqs1, ...seqs2], 0, 44, DEFAULT_CONFIG);
    const totalH = computeContentHeight(rows, 44);
    const sumH = rows.reduce((s, r) => s + r.height, 0);
    expect(totalH).toBe(44 + sumH);
  });
});
