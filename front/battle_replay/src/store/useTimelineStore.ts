import { create } from 'zustand';
import type { BattleEvent, SpellSequence, TimelineViewport } from '../types';

interface TimelineState {
  viewport: TimelineViewport;
  selectedEvent: BattleEvent | null;
  selectedSequence: SpellSequence | null;
  totalLogicalHeight: number;
  sessionStartTs: number;
  sessionEndTs: number;
  sessionDurationMs: number;

  // 操作
  setViewport: (vp: Partial<TimelineViewport>) => void;
  initViewport: (sessionStartTs: number, sessionEndTs: number, viewStartTs?: number, viewEndTs?: number) => void;
  setSessionBounds: (startTs: number, endTs: number) => void;
  zoom: (factor: number, anchorTs: number) => void;
  pan: (deltaTs: number) => void;
  scrollBy: (deltaY: number) => void;
  selectEvent: (event: BattleEvent | null) => void;
  selectSequence: (seq: SpellSequence | null) => void;
  setTotalLogicalHeight: (h: number) => void;
}

/** 将视口时间范围 clamp 到会话边界，保持 range 不变 */
function clampRange(start: number, end: number, sessStart: number, sessEnd: number): [number, number] {
  const range = end - start;
  if (start < sessStart) return [sessStart, sessStart + range];
  if (end > sessEnd)     return [sessEnd - range, sessEnd];
  return [start, end];
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  viewport: { startTs: 0, endTs: 0, scrollY: 0 },
  selectedEvent: null,
  selectedSequence: null,
  totalLogicalHeight: 0,
  sessionStartTs: 0,
  sessionEndTs: 0,
  sessionDurationMs: 0,

  setViewport: (vp) => {
    const s = get();
    const cur = s.viewport;
    let newStart = vp.startTs ?? cur.startTs;
    let newEnd   = vp.endTs   ?? cur.endTs;
    if (s.sessionDurationMs > 0) {
      [newStart, newEnd] = clampRange(newStart, newEnd, s.sessionStartTs, s.sessionEndTs);
    }
    set(prev => ({ viewport: { ...prev.viewport, ...vp, startTs: newStart, endTs: newEnd } }));
  },

  initViewport: (sessionStartTs, sessionEndTs, viewStartTs, viewEndTs) =>
    set({
      viewport: { startTs: viewStartTs ?? sessionStartTs, endTs: viewEndTs ?? sessionEndTs, scrollY: 0 },
      selectedEvent: null,
      selectedSequence: null,
      sessionStartTs,
      sessionEndTs,
      sessionDurationMs: sessionEndTs - sessionStartTs,
    }),

  setSessionBounds: (startTs, endTs) => set({
    sessionStartTs: startTs,
    sessionEndTs: endTs,
    sessionDurationMs: endTs - startTs,
  }),

  zoom: (factor, anchorTs) => {
    const { viewport, sessionStartTs, sessionEndTs, sessionDurationMs } = get();
    const { startTs, endTs } = viewport;
    const leftRatio = (anchorTs - startTs) / (endTs - startTs);
    const newRange = (endTs - startTs) / factor;
    const clampedRange = Math.max(5_000, Math.min(newRange, sessionDurationMs));
    let newStart = anchorTs - leftRatio * clampedRange;
    let newEnd   = newStart + clampedRange;
    if (sessionDurationMs > 0) {
      [newStart, newEnd] = clampRange(newStart, newEnd, sessionStartTs, sessionEndTs);
    }
    set(s => ({ viewport: { ...s.viewport, startTs: newStart, endTs: newEnd } }));
  },

  pan: (deltaTs) => {
    const { viewport, sessionStartTs, sessionEndTs, sessionDurationMs } = get();
    let newStart = viewport.startTs + deltaTs;
    let newEnd   = viewport.endTs + deltaTs;
    if (sessionDurationMs > 0) {
      [newStart, newEnd] = clampRange(newStart, newEnd, sessionStartTs, sessionEndTs);
    }
    set(s => ({ viewport: { ...s.viewport, startTs: newStart, endTs: newEnd } }));
  },

  scrollBy: (deltaY) => {
    const { viewport, totalLogicalHeight } = get();
    const maxScrollY = Math.max(0, totalLogicalHeight - 200);
    const newScrollY = Math.max(0, Math.min(viewport.scrollY + deltaY, maxScrollY));
    set(s => ({ viewport: { ...s.viewport, scrollY: newScrollY } }));
  },

  selectEvent: (event) => set({ selectedEvent: event }),

  selectSequence: (seq) => set({
    selectedSequence: seq,
    selectedEvent: seq?.castStartEvent ?? null,
  }),

  setTotalLogicalHeight: (h) => set({ totalLogicalHeight: h }),
}));
