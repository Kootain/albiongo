import { create } from "zustand";

interface ActiveTrigger {
  blockId: string;
  timestamp: number;
  flashing: boolean;
}

interface EventStore {
  activeTriggers: Record<string, ActiveTrigger>;
  triggerBlock: (blockId: string) => void;
  clearTrigger: (blockId: string) => void;
}

export const useEventStore = create<EventStore>((set) => ({
  activeTriggers: {},
  triggerBlock: (blockId) =>
    set((state) => {
      const now = Date.now();
      const existing = state.activeTriggers[blockId];
      if (existing && now - existing.timestamp < 1000) {
        // Flash
        return {
          activeTriggers: {
            ...state.activeTriggers,
            [blockId]: { blockId, timestamp: now, flashing: true },
          },
        };
      }
      return {
        activeTriggers: {
          ...state.activeTriggers,
          [blockId]: { blockId, timestamp: now, flashing: false },
        },
      };
    }),
  clearTrigger: (blockId) =>
    set((state) => {
      const newTriggers = { ...state.activeTriggers };
      delete newTriggers[blockId];
      return { activeTriggers: newTriggers };
    }),
}));
