import { create } from 'zustand';
import type { BattleEvent, BattleSession, EventFilters, EventType, SpellSequence } from '../types';
import BattleParserWorker from '../workers/battleParser.worker.ts?worker';
import { buildSpellSequences } from '../utils/spellSequenceBuilder';

interface BattleState {
  session: BattleSession | null;
  isLoading: boolean;
  loadProgress: number;   // 0–100
  loadError: string | null;
  isLive: boolean;        // 当前数据来自实时 WS

  filters: EventFilters;
  filteredEvents: BattleEvent[];   // 预计算好的过滤结果
  showAllEvents: boolean;          // 忽略过滤器，展示全部事件
  spellSequences: SpellSequence[]; // 聚合后的施法序列

  // 操作
  loadFile: (file: File) => void;
  initLiveSession: () => void;
  appendLiveEvent: (event: BattleEvent) => void;
  setEventTypeFilter: (type: EventType, enabled: boolean) => void;
  setGuildFilter: (guild: string, enabled: boolean) => void;
  setPlayerNameFilter: (name: string) => void;
  resetFilters: () => void;
  toggleShowAllEvents: () => void;
}

function eventMatchesFilters(ev: BattleEvent, filters: EventFilters): boolean {
  if (!filters.eventTypes.has(ev.type)) return false;
  if (filters.guilds.size > 0 && ev.actorGuild && !filters.guilds.has(ev.actorGuild)) return false;
  if (filters.playerName) {
    const q = filters.playerName.toLowerCase();
    if (!ev.actorName?.toLowerCase().includes(q) && !ev.targetName?.toLowerCase().includes(q)) return false;
  }
  return true;
}

function applyFilters(events: BattleEvent[], filters: EventFilters): BattleEvent[] {
  return events.filter(ev => eventMatchesFilters(ev, filters));
}

const DEFAULT_EVENT_TYPES: Set<EventType> = new Set([
  'new_character', 'leave',
  'cast_spell', 'cast_hit', 'cast_hits', 'cast_start', 'cast_finished',
  'cast_cancel', 'channeling_ended',
  'attack', 'health_update', 'health_updates',
  'equipment_change', 'kill', 'forced_movement', 'spell_effect_area',
  'mounted', 'mount_start',
]);

const DEFAULT_FILTERS: EventFilters = {
  eventTypes: DEFAULT_EVENT_TYPES,
  guilds: new Set(),
  playerName: '',
};

export const useBattleStore = create<BattleState>((set, get) => ({
  session: null,
  isLoading: false,
  loadProgress: 0,
  loadError: null,
  isLive: false,
  filters: { ...DEFAULT_FILTERS, eventTypes: new Set(DEFAULT_EVENT_TYPES) },
  filteredEvents: [],
  showAllEvents: false,
  spellSequences: [],

  initLiveSession: () => {
    const emptySession: BattleSession = {
      startTs: 0, endTs: 0, durationMs: 0,
      totalEvents: 0, events: [],
      players: {}, playersByName: {},
      guilds: [], alliances: [],
      eventTypeCounts: {} as BattleSession['eventTypeCounts'],
    };
    set({ isLive: true, session: emptySession, filteredEvents: [], spellSequences: [], isLoading: false, loadError: null });
  },

  appendLiveEvent: (event) => {
    const { session, filters, showAllEvents } = get();
    if (!session) return;

    const isFirst    = session.totalEvents === 0;
    const newStartTs = isFirst ? event.ts : session.startTs;
    const newEndTs   = Math.max(session.endTs, event.ts);
    const newEvents  = [...session.events, event];
    const newCounts  = { ...session.eventTypeCounts, [event.type]: (session.eventTypeCounts[event.type] ?? 0) + 1 };

    const newSession: BattleSession = {
      startTs: newStartTs, endTs: newEndTs,
      durationMs: newEndTs - newStartTs,
      totalEvents: newEvents.length,
      events: newEvents,
      players: session.players, playersByName: session.playersByName,
      guilds: session.guilds,   alliances: session.alliances,
      eventTypeCounts: newCounts,
    };

    const passes     = showAllEvents || eventMatchesFilters(event, filters);
    const newFiltered = passes ? [...get().filteredEvents, event] : get().filteredEvents;

    set({ session: newSession, filteredEvents: newFiltered, spellSequences: buildSpellSequences(newEvents) });
  },

  loadFile: (file: File) => {
    set({ isLoading: true, loadProgress: 0, loadError: null, session: null, filteredEvents: [], isLive: false });

    const worker = new BattleParserWorker();

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        set({ loadProgress: Math.round((msg.parsed / msg.total) * 100) });
      } else if (msg.type === 'done') {
        const { filters } = get();
        const filteredEvents = applyFilters(msg.session.events, filters);
        set({
          session: msg.session,
          filteredEvents,
          spellSequences: buildSpellSequences(msg.session.events),
          isLoading: false,
          loadProgress: 100,
        });
        worker.terminate();
      } else if (msg.type === 'error') {
        set({ isLoading: false, loadError: msg.message });
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      set({ isLoading: false, loadError: err.message });
      worker.terminate();
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      worker.postMessage(e.target!.result as string);
    };
    reader.readAsText(file);
  },

  setEventTypeFilter: (type, enabled) => {
    const { filters, session } = get();
    const newTypes = new Set(filters.eventTypes);
    if (enabled) newTypes.add(type); else newTypes.delete(type);
    const newFilters = { ...filters, eventTypes: newTypes };
    set({
      filters: newFilters,
      filteredEvents: session ? applyFilters(session.events, newFilters) : [],
    });
  },

  setGuildFilter: (guild, enabled) => {
    const { filters, session } = get();
    const newGuilds = new Set(filters.guilds);
    if (enabled) newGuilds.add(guild); else newGuilds.delete(guild);
    const newFilters = { ...filters, guilds: newGuilds };
    set({
      filters: newFilters,
      filteredEvents: session ? applyFilters(session.events, newFilters) : [],
    });
  },

  setPlayerNameFilter: (name) => {
    const { filters, session } = get();
    const newFilters = { ...filters, playerName: name };
    set({
      filters: newFilters,
      filteredEvents: session ? applyFilters(session.events, newFilters) : [],
    });
  },

  resetFilters: () => {
    const { session } = get();
    const newFilters: EventFilters = {
      eventTypes: new Set(DEFAULT_EVENT_TYPES),
      guilds: new Set(),
      playerName: '',
    };
    set({
      filters: newFilters,
      filteredEvents: session ? applyFilters(session.events, newFilters) : [],
    });
  },

  toggleShowAllEvents: () => set(s => ({ showAllEvents: !s.showAllEvents })),
}));
