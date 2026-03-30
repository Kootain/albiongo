// ─── 游戏感知绘制单元 ──────────────────────────────────────────────────────────────
// 描述"如何画一个施法序列相关视觉元素"。
// 所有坐标参数由调用方（layout.ts + TimelineCanvas）计算后传入；
// 内部只调用 primitives，不包含时间戳/事件逻辑。

import type { SpellSequence } from '../../types';
import {
  drawBadge,
  drawHorizontalRule,
  fillGradientRect,
  fillRect,
  fillTruncatedText,
} from './primitives';

type Ctx = CanvasRenderingContext2D;

// ─── 颜色常量 ─────────────────────────────────────────────────────────────────────
const OUTCOME_COLORS: Record<SpellSequence['outcome'], string> = {
  success:     '#6366f1', // indigo-500
  interrupted: '#f87171', // red-400
  cancelled:   '#71717a', // zinc-500
  unknown:     '#52525b', // zinc-600
};

const AOE_COLOR         = 'rgba(99,102,241,0.4)';
const SELECTION_COLOR   = 'rgba(99,102,241,0.15)';
const LABEL_COLOR       = '#a1a1aa'; // zinc-400
const BADGE_BG          = '#ffffff';
const BADGE_FG          = '#18181b'; // zinc-900
const CHANNELING_START  = '#6366f1'; // indigo-500
const CHANNELING_END    = '#c084fc'; // purple-400
const DIVIDER_COLOR     = '#27272a'; // zinc-800

/** 主施法线段（颜色取决于 outcome） */
export function drawCastBar(
  ctx: Ctx,
  x: number,
  y: number,
  width: number,
  height: number,
  outcome: SpellSequence['outcome'],
): void {
  fillRect(ctx, x, y, width, height, OUTCOME_COLORS[outcome]);
}

/** 吟唱阶段线段（indigo→purple 渐变，覆盖在主线段上方） */
export function drawChannelingBar(
  ctx: Ctx,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  fillGradientRect(ctx, x, y, width, height, CHANNELING_START, CHANNELING_END);
}

/** AoE 子轨线段（半透明 indigo） */
export function drawAoeBar(
  ctx: Ctx,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  fillRect(ctx, x, y, width, height, AOE_COLOR);
}

/** 命中数量 badge（白圆 + 黑字） */
export function drawHitBadge(
  ctx: Ctx,
  cx: number,
  cy: number,
  count: number,
): void {
  const radius = count >= 10 ? 8 : 7;
  ctx.font = `bold ${radius + 3}px sans-serif`;
  drawBadge(ctx, cx, cy, radius, String(count), BADGE_BG, BADGE_FG);
}

/** 玩家名标签（左侧固定区，超长截断） */
export function drawPlayerLabel(
  ctx: Ctx,
  name: string,
  x: number,
  y: number,
  maxWidth: number,
): void {
  ctx.font = '12px sans-serif';
  fillTruncatedText(ctx, name, x, y, maxWidth, LABEL_COLOR);
}

/** 选中高亮背景（半透明 indigo 矩形） */
export function drawSelectionHighlight(
  ctx: Ctx,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  fillRect(ctx, x, y, width, height, SELECTION_COLOR);
}

/** 行间分隔线 */
export { drawHorizontalRule };
export { DIVIDER_COLOR };
