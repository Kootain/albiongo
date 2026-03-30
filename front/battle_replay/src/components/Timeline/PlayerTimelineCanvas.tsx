import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useBattleStore } from '../../store/useBattleStore';
import { useTimelineStore } from '../../store/useTimelineStore';
import type { BattleEvent, SpellSequence } from '../../types';
import { EVENT_TYPE_COLORS } from '../../types';

// ─── 渲染常量 ─────────────────────────────────────────────────────────────────
const LABEL_WIDTH   = 150;
const ROW_HEIGHT    = 34;
const BAR_HEIGHT    = 16;
const BAR_PADDING   = (ROW_HEIGHT - BAR_HEIGHT) / 2;
const HEADER_HEIGHT = 44;
const SCROLLBAR_W   = 8;
const DOT_R         = 3;
const MIN_BAR_W     = 3;

const OUTCOME_COLORS: Record<SpellSequence['outcome'], string> = {
  success:     '#6366f1',
  interrupted: '#ef4444',
  cancelled:   '#52525b',
  unknown:     '#3f3f46',
};

const OUTCOME_CHANNELING: Record<SpellSequence['outcome'], string> = {
  success:     '#818cf8',
  interrupted: '#fca5a5',
  cancelled:   '#71717a',
  unknown:     '#52525b',
};

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function formatTickLabel(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ─── 命中检测类型 ─────────────────────────────────────────────────────────────

interface RenderedBar {
  seq: SpellSequence;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

interface RenderedDot {
  event: BattleEvent;
  x: number;
  y: number;
}

// ─── 组件 ─────────────────────────────────────────────────────────────────────

export const PlayerTimelineCanvas: React.FC = () => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollYRef   = useRef(0);
  const isDraggingRef  = useRef(false);
  const hasDraggedRef  = useRef(false);
  const dragStartXRef  = useRef(0);
  const dragStartTsRef = useRef(0);
  const barsRef        = useRef<RenderedBar[]>([]);
  const dotsRef        = useRef<RenderedDot[]>([]);

  const filteredEvents = useBattleStore(s => s.filteredEvents);
  const showAllEvents  = useBattleStore(s => s.showAllEvents);
  const session        = useBattleStore(s => s.session);
  const isLive         = useBattleStore(s => s.isLive);
  const spellSequences = useBattleStore(s => s.spellSequences);

  const displayEvents = showAllEvents ? (session?.events ?? []) : filteredEvents;

  const viewport       = useTimelineStore(s => s.viewport);
  const zoom           = useTimelineStore(s => s.zoom);
  const selectSequence = useTimelineStore(s => s.selectSequence);
  const selectEvent    = useTimelineStore(s => s.selectEvent);

  // ─── 玩家列表（按事件数降序） ──────────────────────────────────────────────

  const playerList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ev of displayEvents) {
      if (ev.actorName) counts.set(ev.actorName, (counts.get(ev.actorName) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [displayEvents]);

  // 按玩家名分组的施法序列
  const seqByPlayer = useMemo(() => {
    const map = new Map<string, SpellSequence[]>();
    for (const seq of spellSequences) {
      if (!map.has(seq.actorName)) map.set(seq.actorName, []);
      map.get(seq.actorName)!.push(seq);
    }
    return map;
  }, [spellSequences]);

  // 按玩家名分组的标记事件（kill / attack / forced_movement 显示为小点）
  const dotsByPlayer = useMemo(() => {
    const seqIds = new Set<string>();
    for (const seq of spellSequences) {
      seqIds.add(seq.castStartEvent.id);
      if (seq.castEndEvent)   seqIds.add(seq.castEndEvent.id);
      if (seq.castSpellEvent) seqIds.add(seq.castSpellEvent.id);
    }
    const dotTypes = new Set(['kill', 'attack', 'forced_movement']);
    const map = new Map<string, BattleEvent[]>();
    for (const ev of displayEvents) {
      if (!ev.actorName || !dotTypes.has(ev.type) || seqIds.has(ev.id)) continue;
      if (!map.has(ev.actorName)) map.set(ev.actorName, []);
      map.get(ev.actorName)!.push(ev);
    }
    return map;
  }, [displayEvents, spellSequences]);

  // ─── 绘制 ─────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const { startTs, endTs } = viewport;
    const timeRange = endTs - startTs;
    if (timeRange <= 0) return;

    const scrollY   = scrollYRef.current;
    const contentW  = W - SCROLLBAR_W;
    const timelineW = contentW - LABEL_WIDTH;
    const tsToX = (ts: number) => LABEL_WIDTH + ((ts - startTs) / timeRange) * timelineW;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, W, H);

    const totalH   = HEADER_HEIGHT + playerList.length * ROW_HEIGHT;
    const maxScroll = Math.max(0, totalH - H);
    if (scrollYRef.current > maxScroll) scrollYRef.current = maxScroll;

    // ── 时间刻度垂直线 ────────────────────────────────────────────────────
    const tickCount      = Math.max(1, Math.floor(timelineW / 80));
    const tickIntervalMs = Math.ceil(timeRange / tickCount / 1000) * 1000;
    const firstTick      = Math.ceil(startTs / tickIntervalMs) * tickIntervalMs;

    ctx.strokeStyle = '#1c1c1f';
    ctx.lineWidth   = 1;
    for (let ts = firstTick; ts <= endTs; ts += tickIntervalMs) {
      const x = tsToX(ts);
      if (x < LABEL_WIDTH || x > contentW) continue;
      ctx.beginPath();
      ctx.moveTo(x, HEADER_HEIGHT);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // ── 行背景（可见行） ──────────────────────────────────────────────────
    for (let i = 0; i < playerList.length; i++) {
      const rowTop = HEADER_HEIGHT + i * ROW_HEIGHT - scrollY;
      if (rowTop + ROW_HEIGHT < HEADER_HEIGHT || rowTop > H) continue;
      ctx.fillStyle = i % 2 === 0 ? '#0a0a0d' : '#0d0d11';
      ctx.fillRect(LABEL_WIDTH, rowTop, timelineW, ROW_HEIGHT);
      ctx.strokeStyle = '#1c1c1f';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(LABEL_WIDTH, rowTop + ROW_HEIGHT - 0.5);
      ctx.lineTo(contentW, rowTop + ROW_HEIGHT - 0.5);
      ctx.stroke();
    }

    // ── 时间线内容（clipped）─────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(LABEL_WIDTH, HEADER_HEIGHT, timelineW, H - HEADER_HEIGHT);
    ctx.clip();

    const newBars: RenderedBar[] = [];
    const newDots: RenderedDot[] = [];

    for (let i = 0; i < playerList.length; i++) {
      const name   = playerList[i];
      const rowTop = HEADER_HEIGHT + i * ROW_HEIGHT - scrollY;
      if (rowTop + ROW_HEIGHT < HEADER_HEIGHT || rowTop > H) continue;

      const barY = rowTop + BAR_PADDING;
      const midY = rowTop + ROW_HEIGHT / 2;

      // 施法序列 bars
      for (const seq of seqByPlayer.get(name) ?? []) {
        if (seq.castEndTs < startTs || seq.castStartTs > endTs) continue;

        const rawX1 = tsToX(seq.castStartTs);
        const rawX2 = tsToX(seq.castEndTs);
        const x1 = Math.max(LABEL_WIDTH, rawX1);
        const x2 = Math.max(x1 + MIN_BAR_W, Math.min(contentW, rawX2));
        if (x1 >= contentW) continue;

        ctx.fillStyle = OUTCOME_COLORS[seq.outcome];
        ctx.beginPath();
        ctx.roundRect(x1, barY, x2 - x1, BAR_HEIGHT, 2);
        ctx.fill();

        // 吟唱延伸段
        if (seq.channelingEndTs !== undefined && seq.channelingEndTs > seq.castEndTs) {
          const cx2 = Math.min(contentW, tsToX(seq.channelingEndTs));
          if (cx2 > x2) {
            ctx.fillStyle   = OUTCOME_CHANNELING[seq.outcome];
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.roundRect(x2, barY + 3, cx2 - x2, BAR_HEIGHT - 6, 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        newBars.push({ seq, x1, x2, y1: barY, y2: barY + BAR_HEIGHT });
      }

      // 事件点
      for (const ev of dotsByPlayer.get(name) ?? []) {
        if (ev.ts < startTs || ev.ts > endTs) continue;
        const x = tsToX(ev.ts);
        ctx.beginPath();
        ctx.arc(x, midY, DOT_R, 0, Math.PI * 2);
        ctx.fillStyle = EVENT_TYPE_COLORS[ev.type];
        ctx.fill();
        newDots.push({ event: ev, x, y: midY });
      }
    }

    ctx.restore();
    barsRef.current = newBars;
    dotsRef.current = newDots;

    // ── 固定标签列（最后绘制，覆盖在时间线上方）────────────────────────────
    for (let i = 0; i < playerList.length; i++) {
      const rowTop = HEADER_HEIGHT + i * ROW_HEIGHT - scrollY;
      if (rowTop + ROW_HEIGHT < HEADER_HEIGHT || rowTop > H) continue;
      ctx.fillStyle = i % 2 === 0 ? '#111114' : '#131317';
      ctx.fillRect(0, rowTop, LABEL_WIDTH - 1, ROW_HEIGHT);
    }

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(LABEL_WIDTH - 0.5, HEADER_HEIGHT);
    ctx.lineTo(LABEL_WIDTH - 0.5, H);
    ctx.stroke();

    ctx.font         = '12px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'left';
    const maxNameW = LABEL_WIDTH - 16;

    for (let i = 0; i < playerList.length; i++) {
      const rowTop = HEADER_HEIGHT + i * ROW_HEIGHT - scrollY;
      if (rowTop + ROW_HEIGHT < HEADER_HEIGHT || rowTop > H) continue;

      let label = playerList[i];
      while (ctx.measureText(label).width > maxNameW && label.length > 4) {
        label = label.slice(0, -1);
      }
      if (label !== playerList[i]) label += '…';

      ctx.fillStyle = '#d4d4d8';
      ctx.fillText(label, 10, rowTop + ROW_HEIGHT / 2);
    }

    // ── 时间轴头部（最后绘制，始终在最顶层）─────────────────────────────────
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, contentW, HEADER_HEIGHT);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_HEIGHT - 0.5);
    ctx.lineTo(contentW, HEADER_HEIGHT - 0.5);
    ctx.stroke();

    ctx.font         = '11px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    for (let ts = firstTick; ts <= endTs; ts += tickIntervalMs) {
      const x = tsToX(ts);
      if (x < LABEL_WIDTH || x > contentW) continue;
      ctx.strokeStyle = '#52525b';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(x, HEADER_HEIGHT - 8);
      ctx.lineTo(x, HEADER_HEIGHT);
      ctx.stroke();
      ctx.fillStyle = '#71717a';
      ctx.fillText(formatTickLabel(ts), x, HEADER_HEIGHT / 2);
    }

    // 标签列头部覆盖
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, LABEL_WIDTH, HEADER_HEIGHT);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(LABEL_WIDTH - 0.5, 0);
    ctx.lineTo(LABEL_WIDTH - 0.5, HEADER_HEIGHT - 0.5);
    ctx.stroke();

    // ── 滚动条 ────────────────────────────────────────────────────────────
    const scrollableH = H - HEADER_HEIGHT;
    if (totalH > scrollableH) {
      const thumbH = Math.max(30, (scrollableH / totalH) * scrollableH);
      const thumbY = HEADER_HEIGHT + (maxScroll > 0 ? (scrollY / maxScroll) * (scrollableH - thumbH) : 0);

      ctx.fillStyle = '#1c1c1f';
      ctx.fillRect(contentW, HEADER_HEIGHT, SCROLLBAR_W, scrollableH);

      ctx.fillStyle = '#52525b';
      ctx.beginPath();
      ctx.roundRect(contentW + 1, thumbY, SCROLLBAR_W - 2, thumbH, 3);
      ctx.fill();
    }
  }, [viewport, playerList, seqByPlayer, dotsByPlayer]);

  // ─── 响应变化重绘 ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const { width, height } = container.getBoundingClientRect();
    if (canvas.width !== Math.floor(width) || canvas.height !== Math.floor(height)) {
      canvas.width  = Math.floor(width);
      canvas.height = Math.floor(height);
    }
    draw();
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  // ─── 滚轮（native，passive:false） ───────────────────────────────────────
  const handleWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.ctrlKey || e.metaKey) {
      const rect       = canvas.getBoundingClientRect();
      const mouseX     = e.clientX - rect.left - LABEL_WIDTH;
      const { startTs, endTs } = viewport;
      const timelineW  = canvas.width - SCROLLBAR_W - LABEL_WIDTH;
      const anchorTs   = startTs + (mouseX / timelineW) * (endTs - startTs);
      zoom(e.deltaY < 0 ? 1.3 : 1 / 1.3, anchorTs);
    } else {
      const totalH    = HEADER_HEIGHT + playerList.length * ROW_HEIGHT;
      const maxScroll = Math.max(0, totalH - canvas.height);
      scrollYRef.current = Math.max(0, Math.min(scrollYRef.current + e.deltaY, maxScroll));
      draw();
    }
  }, [viewport, zoom, playerList, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheelNative);
  }, [handleWheelNative]);

  // ─── 拖拽平移 ────────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const rect  = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    if (mouseX < LABEL_WIDTH) return;
    isDraggingRef.current  = true;
    hasDraggedRef.current  = false;
    dragStartXRef.current  = e.clientX;
    dragStartTsRef.current = viewport.startTs;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [viewport]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dx = e.clientX - dragStartXRef.current;
    if (Math.abs(dx) > 4) hasDraggedRef.current = true;
    const timelineW = canvas.width - SCROLLBAR_W - LABEL_WIDTH;
    const timeRange = viewport.endTs - viewport.startTs;
    const deltaTs   = -(dx / timelineW) * timeRange;
    const newStart  = dragStartTsRef.current + deltaTs;
    useTimelineStore.getState().setViewport({ startTs: newStart, endTs: newStart + timeRange });
  }, [viewport]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // ─── 点击命中检测 ────────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (hasDraggedRef.current) { hasDraggedRef.current = false; return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (my < HEADER_HEIGHT || mx < LABEL_WIDTH) {
      selectSequence(null);
      selectEvent(null);
      return;
    }

    // bar 命中（从后往前，最后绘制的最靠上）
    for (let i = barsRef.current.length - 1; i >= 0; i--) {
      const b = barsRef.current[i];
      if (mx >= b.x1 && mx <= b.x2 && my >= b.y1 && my <= b.y2) {
        selectSequence(b.seq);
        return;
      }
    }

    // dot 命中
    let closestDot: BattleEvent | null = null;
    let minDist = DOT_R * 3;
    for (const d of dotsRef.current) {
      const dist = Math.sqrt((mx - d.x) ** 2 + (my - d.y) ** 2);
      if (dist < minDist) { minDist = dist; closestDot = d.event; }
    }
    if (closestDot) {
      selectSequence(null);
      selectEvent(closestDot);
      return;
    }

    selectSequence(null);
    selectEvent(null);
  }, [selectSequence, selectEvent]);

  // ─── 空状态 ──────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm select-none">
        请在顶部选择 JSONL 日志文件
      </div>
    );
  }

  if (isLive && session.totalEvents === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm select-none">
        等待战斗事件…
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      />
    </div>
  );
};
