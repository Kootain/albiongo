import { describe, expect, it, vi } from 'vitest';
import {
  drawAoeBar,
  drawCastBar,
  drawChannelingBar,
  drawHitBadge,
  drawPlayerLabel,
  drawSelectionHighlight,
} from '../timelineDrawer';

// ─── mock ctx ───────────────────────────────────────────────────────────────

function makeMockCtx(): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    strokeStyle: '',
    font: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  } as unknown as CanvasRenderingContext2D;
}

// ─── drawCastBar ─────────────────────────────────────────────────────────────

describe('drawCastBar', () => {
  it('success 应填充 #6366f1', () => {
    const ctx = makeMockCtx();
    drawCastBar(ctx, 0, 0, 100, 8, 'success');
    expect(ctx.fillStyle).toBe('#6366f1');
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 100, 8);
  });

  it('interrupted 应填充 #f87171', () => {
    const ctx = makeMockCtx();
    drawCastBar(ctx, 0, 0, 50, 8, 'interrupted');
    expect(ctx.fillStyle).toBe('#f87171');
  });

  it('cancelled 应填充 #71717a', () => {
    const ctx = makeMockCtx();
    drawCastBar(ctx, 0, 0, 50, 8, 'cancelled');
    expect(ctx.fillStyle).toBe('#71717a');
  });

  it('unknown 应填充 #52525b', () => {
    const ctx = makeMockCtx();
    drawCastBar(ctx, 0, 0, 50, 8, 'unknown');
    expect(ctx.fillStyle).toBe('#52525b');
  });
});

// ─── drawChannelingBar ────────────────────────────────────────────────────────

describe('drawChannelingBar', () => {
  it('应创建 LinearGradient 并填充矩形', () => {
    const ctx = makeMockCtx();
    drawChannelingBar(ctx, 10, 20, 80, 8);
    expect(ctx.createLinearGradient).toHaveBeenCalledWith(10, 20, 90, 20);
    expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 80, 8);
  });
});

// ─── drawAoeBar ───────────────────────────────────────────────────────────────

describe('drawAoeBar', () => {
  it('应填充半透明 indigo 颜色', () => {
    const ctx = makeMockCtx();
    drawAoeBar(ctx, 5, 10, 60, 5);
    expect(ctx.fillStyle).toBe('rgba(99,102,241,0.4)');
    expect(ctx.fillRect).toHaveBeenCalledWith(5, 10, 60, 5);
  });
});

// ─── drawHitBadge ─────────────────────────────────────────────────────────────

describe('drawHitBadge', () => {
  it('应绘制圆形 badge', () => {
    const ctx = makeMockCtx();
    drawHitBadge(ctx, 50, 50, 3);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalledTimes(1); // background circle
    expect(ctx.fillText).toHaveBeenCalledWith('3', 50, 50); // text
  });
});

// ─── drawPlayerLabel ─────────────────────────────────────────────────────────

describe('drawPlayerLabel', () => {
  it('应调用 fillText', () => {
    const ctx = makeMockCtx();
    drawPlayerLabel(ctx, 'Alice', 5, 20, 100);
    expect(ctx.fillText).toHaveBeenCalled();
    expect(ctx.fillStyle).toBe('#a1a1aa');
  });
});

// ─── drawSelectionHighlight ───────────────────────────────────────────────────

describe('drawSelectionHighlight', () => {
  it('应填充半透明 indigo 矩形', () => {
    const ctx = makeMockCtx();
    drawSelectionHighlight(ctx, 0, 0, 200, 28);
    expect(ctx.fillStyle).toBe('rgba(99,102,241,0.15)');
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 200, 28);
  });
});
