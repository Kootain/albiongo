import { create } from 'zustand';
import type { BattleEvent, BattleSession, EventFilters, EventType } from '../types';
import BattleParserWorker from '../workers/battleParser.worker.ts?worker';

interface BattleState {
  session: BattleSession | null;
  isLoading: boolean;
  loadProgress: number;   // 0–100
  loadError: string | null;

  filters: EventFilters;
  filteredEvents: BattleEvent[];   // 预计算好的过滤结果
  showAllEvents: boolean;          // 忽略过滤器，展示全部事件

  // 操作
  loadFile: (file: File) => void;
  setEventTypeFilter: (type: EventType, enabled: boolean) => void;
  setGuildFilter: (guild: string, enabled: boolean) => void;
  setPlayerNameFilter: (name: string) => void;
  resetFilters: () => void;
  toggleShowAllEvents: () => void;
}

function applyFilters(events: BattleEvent[], filters: EventFilters): BattleEvent[] {
  return events.filter(ev => {
    if (!filters.eventTypes.has(ev.type)) return false;
    if (filters.guilds.size > 0 && ev.actorGuild && !filters.guilds.has(ev.actorGuild)) return false;
    if (filters.playerName) {
      const q = filters.playerName.toLowerCase();
      const matchActor = ev.actorName?.toLowerCase().includes(q);
      const matchTarget = ev.targetName?.toLowerCase().includes(q);
      if (!matchActor && !matchTarget) return false;
    }
    return true;
  });
}

const DEFAULT_EVENT_TYPES: Set<EventType> = new Set([
  'new_character', 'leave',
  'cast_spell', 'cast_hit', 'cast_hits', 'cast_start', 'cast_finished',
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
  filters: { ...DEFAULT_FILTERS, eventTypes: new Set(DEFAULT_EVENT_TYPES) },
  filteredEvents: [],
  showAllEvents: false,

  loadFile: (file: File) => {
    set({ isLoading: true, loadProgress: 0, loadError: null, session: null, filteredEvents: [] });

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
