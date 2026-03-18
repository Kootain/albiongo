import { create } from 'zustand';
import { BaseEvent } from '../events/BaseEvent';
import { Player } from '../types';

interface ReplayEvent extends BaseEvent {
  timestamp: number;
  type: 'cast' | 'hit' | 'damage' | 'heal' | 'buff' | 'debuff' | 'death';
  sourceName?: string;
  targetName?: string;
  details?: any;
}

interface ReplayFilter {
  guilds: string[];
  alliances: string[];
  players: string[];
  weapons: string[];
}

interface ReplayState {
  events: ReplayEvent[];
  players: Record<string, Player>; // Map by player name for quick access
  currentTime: number;
  startTime: number;
  endTime: number;
  isPlaying: boolean;
  speed: number;
  filters: ReplayFilter;
  selectedEvent: ReplayEvent | null;
  
  // Actions
  setEvents: (events: ReplayEvent[]) => void;
  setPlayers: (players: Player[]) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setSpeed: (speed: number) => void;
  setFilters: (filters: Partial<ReplayFilter>) => void;
  selectEvent: (event: ReplayEvent | null) => void;
}

export const useReplayStore = create<ReplayState>((set, get) => ({
  events: [],
  players: {},
  currentTime: 0,
  startTime: 0,
  endTime: 0,
  isPlaying: false,
  speed: 1,
  filters: {
    guilds: [],
    alliances: [],
    players: [],
    weapons: []
  },
  selectedEvent: null,

  setEvents: (events) => {
    if (events.length === 0) return;
    const startTime = events[0].timestamp;
    const endTime = events[events.length - 1].timestamp;
    set({ events, startTime, endTime, currentTime: startTime });
  },

  setPlayers: (playerList) => {
    const playerMap: Record<string, Player> = {};
    playerList.forEach(p => playerMap[p.Name] = p);
    set({ players: playerMap });
  },

  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setSpeed: (speed) => set({ speed }),
  
  setFilters: (newFilters) => set(state => ({
    filters: { ...state.filters, ...newFilters }
  })),

  selectEvent: (event) => set({ selectedEvent: event }),

}));
