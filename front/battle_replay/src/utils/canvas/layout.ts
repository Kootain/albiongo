// ─── 纯布局计算 ───────────────────────────────────────────────────────────────────
// 零 Canvas API，零副作用。全部为纯函数，可直接 vitest 单元测试。

import type { SpellSequence, TimelineViewport } from '../../types';

// ─── 类型定义 ─────────────────────────────────────────────────────────────────────

export interface RowHeightConfig {
  minHeight: number;    // 无 AoE 时的最小行高（默认 28）
  castBarH: number;     // 施法主线段高度（默认 8）
  aoeBarH: number;      // AoE 子轨高度（默认 5）
  aoeMarginTop: number; // AoE 子轨上方间距（默认 3）
  paddingV: number;     // 行上下各一份内边距（默认 6）
}

export interface PlayerRow {
  actorId: number;
  actorName: string;
  sequences: SpellSequence[];
  y: number;      // Canvas Y 起点（相对于 canvas 顶部，已含 HEADER_HEIGHT 和 scrollY 偏移）
  height: number; // 行高
}

export interface HitEntry {
  sequence: SpellSequence;
  x: number;
  y: number;
  w: number;
  h: number;
}

// ─── 函数实现 ─────────────────────────────────────────────────────────────────────

/**
 * 将时间戳映射为 Canvas X 坐标。
 * labelWidth 为左侧玩家名标签区宽度，时间线绘制区从 labelWidth 开始。
 */
export function tsToX(
  ts: number,
  viewport: TimelineViewport,
  canvasWidth: number,
  labelWidth: number,
): number {
  const timelineWidth = canvasWidth - labelWidth;
  const span = viewport.endTs - viewport.startTs;
  if (span <= 0) return labelWidth;
  return labelWidth + ((ts - viewport.startTs) / span) * timelineWidth;
}

/**
 * 计算单个玩家行的高度。
 * 行高 = paddingV*2 + castBarH + 每个 AoE 子轨的 (aoeBarH + aoeMarginTop)，
 * 但不低于 minHeight。
 */
export function getRowHeight(
  sequences: SpellSequence[],
  config: RowHeightConfig,
): number {
  const maxAoe = sequences.reduce((m, s) => Math.max(m, s.aoeZones.length), 0);
  const h =
    config.paddingV * 2 +
    config.castBarH +
    maxAoe * (config.aoeBarH + config.aoeMarginTop);
  return Math.max(h, config.minHeight);
}

/**
 * 将所有 SpellSequence 按玩家分组，计算每行的 Y 坐标和高度。
 * 玩家按首次 castStartTs 排序。scrollY 已内嵌到 y 中。
 */
export function computePlayerRows(
  spellSequences: SpellSequence[],
  scrollY: number,
  headerHeight: number,
  config: RowHeightConfig,
): PlayerRow[] {
  // 按 actorId 分组，记录首次出现时间
  const groupMap = new Map<
    number,
    { actorName: string; firstTs: number; sequences: SpellSequence[] }
  >();

  for (const seq of spellSequences) {
    const existing = groupMap.get(seq.actorId);
    if (!existing) {
      groupMap.set(seq.actorId, {
        actorName: seq.actorName,
        firstTs: seq.castStartTs,
        sequences: [seq],
      });
    } else {
      existing.sequences.push(seq);
      if (seq.castStartTs < existing.firstTs) existing.firstTs = seq.castStartTs;
    }
  }

  // 按首次出现时间排序
  const sorted = [...groupMap.entries()].sort(
    ([, a], [, b]) => a.firstTs - b.firstTs,
  );

  const rows: PlayerRow[] = [];
  let currentY = headerHeight - scrollY;

  for (const [actorId, { actorName, sequences }] of sorted) {
    const height = getRowHeight(sequences, config);
    rows.push({ actorId, actorName, sequences, y: currentY, height });
    currentY += height;
  }

  return rows;
}

/**
 * 点击命中测试：返回鼠标坐标命中的第一个 SpellSequence，否则 null。
 */
export function hitTest(
  mouseX: number,
  mouseY: number,
  entries: HitEntry[],
): SpellSequence | null {
  for (const entry of entries) {
    if (
      mouseX >= entry.x &&
      mouseX <= entry.x + entry.w &&
      mouseY >= entry.y &&
      mouseY <= entry.y + entry.h
    ) {
      return entry.sequence;
    }
  }
  return null;
}

/**
 * 计算所有玩家行的内容总高度（含 headerHeight）。
 * 用于滚动条的 scrollYMax 计算。
 */
export function computeContentHeight(
  rows: PlayerRow[],
  headerHeight: number,
): number {
  if (rows.length === 0) return headerHeight;
  const last = rows[rows.length - 1];
  return headerHeight + rows.reduce((s, r) => s + r.height, 0);
}
