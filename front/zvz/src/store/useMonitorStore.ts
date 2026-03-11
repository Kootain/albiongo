import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FilterStrategyConfig } from "../filters/skillUseFilters";

export interface BlockAssignment {
  playerName: string;
  spellId: number;
}

export interface ColorBlock {
  id: string;
  color: string;
  assignments: BlockAssignment[];
  filterStrategies?: FilterStrategyConfig[];
  name?: string;
  colSpan?: number;
}

interface MonitorStore {
  rows: number;
  cols: number;
  blocks: ColorBlock[];
  setGrid: (rows: number, cols: number) => void;
  updateBlockColor: (id: string, color: string) => void;
  updateBlockName: (id: string, name: string) => void;
  updateBlockColSpan: (id: string, colSpan: number) => void;
  addAssignment: (blockId: string, assignment: BlockAssignment) => void;
  removeAssignment: (
    blockId: string,
    playerName: string,
    spellId: number,
  ) => void;
  addFilterStrategy: (blockId: string, strategy: FilterStrategyConfig) => void;
  updateFilterStrategy: (blockId: string, strategyId: string, strategy: FilterStrategyConfig) => void;
  removeFilterStrategy: (blockId: string, strategyId: string) => void;
}

const generateColors = (count: number) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 137.508) % 360; // Golden angle approximation
    // Convert HSL to Hex
    const h = hue;
    const s = 70;
    const l = 50;
    const l1 = l / 100;
    const a = (s * Math.min(l1, 1 - l1)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l1 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    colors.push(`#${f(0)}${f(8)}${f(4)}`);
  }
  return colors;
};

export const useMonitorStore = create<MonitorStore>()(
  persist(
    (set) => ({
      rows: 3,
      cols: 4,
      blocks: Array.from({ length: 12 }).map((_, i) => ({
        id: `block-${i}`,
        color: generateColors(12)[i],
        assignments: [],
        filterStrategies: [],
      })),
      setGrid: (rows, cols) =>
        set((state) => {
          const newCount = rows * cols;
          let newBlocks = [...state.blocks];
          if (newCount > newBlocks.length) {
            const addedColors = generateColors(newCount);
            for (let i = newBlocks.length; i < newCount; i++) {
              newBlocks.push({
                id: `block-${i}`,
                color: addedColors[i],
                assignments: [],
                filterStrategies: [],
              });
            }
          } else if (newCount < newBlocks.length) {
            newBlocks = newBlocks.slice(0, newCount);
          }
          return { rows, cols, blocks: newBlocks };
        }),
      updateBlockColor: (id, color) =>
        set((state) => ({
          blocks: state.blocks.map((b) => (b.id === id ? { ...b, color } : b)),
        })),
      updateBlockName: (id, name) =>
        set((state) => ({
          blocks: state.blocks.map((b) => (b.id === id ? { ...b, name } : b)),
        })),
      updateBlockColSpan: (id, colSpan) =>
        set((state) => ({
          blocks: state.blocks.map((b) => (b.id === id ? { ...b, colSpan } : b)),
        })),
      addAssignment: (blockId, assignment) =>
        set((state) => ({
          blocks: state.blocks.map((b) => {
            if (b.id === blockId) {
              // Check if assignment already exists
              const exists = b.assignments.some(
                (a) =>
                  a.playerName === assignment.playerName &&
                  a.spellId === assignment.spellId,
              );
              if (!exists) {
                return { ...b, assignments: [...b.assignments, assignment] };
              }
            }
            return b;
          }),
        })),
      removeAssignment: (blockId, playerName, spellId) =>
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === blockId
              ? {
                  ...b,
                  assignments: b.assignments.filter(
                    (a) => !(a.playerName === playerName && a.spellId === spellId),
                  ),
                }
              : b,
          ),
        })),
      addFilterStrategy: (blockId, strategy) =>
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === blockId
              ? {
                  ...b,
                  filterStrategies: [...(b.filterStrategies || []), strategy],
                }
              : b,
          ),
        })),
      updateFilterStrategy: (blockId, strategyId, strategy) =>
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === blockId
              ? {
                  ...b,
                  filterStrategies: (b.filterStrategies || []).map((s) =>
                    s.id === strategyId ? strategy : s,
                  ),
                }
              : b,
          ),
        })),
      removeFilterStrategy: (blockId, strategyId) =>
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === blockId
              ? {
                  ...b,
                  filterStrategies: (b.filterStrategies || []).filter(
                    (s) => s.id !== strategyId,
                  ),
                }
              : b,
          ),
        })),
    }),
    {
      name: "monitor-store-storage",
    }
  )
);
