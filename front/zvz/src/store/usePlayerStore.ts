import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Player } from "../types";

export interface PlayerColumnConfig {
  id: number;
  name: string;
  width: number;
  filterGuild?: string;
  filterAlliance?: string;
  searchName?: string;
  searchItem?: string;
  sortByWeapon?: boolean;
  sortByWeaponType?: boolean;
}

interface PlayerStore {
  players: Player[];
  guilds: string[];
  alliances: string[];
  columns: PlayerColumnConfig[];
  setPlayers: (players: Player[]) => void;
  addOrUpdatePlayer: (player: Player) => void;
  addColumn: () => void;
  removeColumn: (id: number) => void;
  updateColumnName: (id: number, name: string) => void;
  updateColumnWidth: (id: number, width: number) => void;
  updateColumnFilters: (id: number, filters: Partial<PlayerColumnConfig>) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      players: [],
      guilds: [],
      alliances: [],
      columns: [{ id: Date.now(), name: "Column 1", width: 1 }],
      setPlayers: (players) => {
        const sanitizedPlayers = players.map(p => ({
          ...p,
          Equipments: p.Equipments || [],
          Spells: p.Spells || []
        }));
        const guilds = Array.from(
          new Set(sanitizedPlayers.map((p) => p.GuildName).filter(Boolean)),
        ) as string[];
        const alliances = Array.from(
          new Set(sanitizedPlayers.map((p) => p.AllianceName).filter(Boolean)),
        ) as string[];
        set({ players: sanitizedPlayers, guilds, alliances });
      },
      addOrUpdatePlayer: (player) =>
        set((state) => {
          const existingIndex = state.players.findIndex(
            (p) => p.Name === player.Name,
          );
          let newPlayers;
          if (existingIndex >= 0) {
            newPlayers = [...state.players];
            // Only update fields that are present and not empty/null in the new player object
            // For arrays like Equipments/Spells, we check if they have length > 0
            const existingPlayer = newPlayers[existingIndex];
            const updatedPlayer = { ...existingPlayer };

            if (player.GuildName) updatedPlayer.GuildName = player.GuildName;
            if (player.AllianceName) updatedPlayer.AllianceName = player.AllianceName;
            
            // For Equipments and Spells, check if they are provided and valid
            if (player.Equipments && player.Equipments.length > 0 && !player.Equipments.every(id => id === 0)) {
               updatedPlayer.Equipments = player.Equipments;
            }
            if (player.Spells && player.Spells.length > 0 && !player.Spells.every(id => id === 0)) {
               updatedPlayer.Spells = player.Spells;
            }

            newPlayers[existingIndex] = updatedPlayer;
          } else {
            const sanitizedPlayer = {
                Name: player.Name,
                GuildName: player.GuildName || "",
                AllianceName: player.AllianceName || "",
                Equipments: player.Equipments || [],
                Spells: player.Spells || []
            };
            newPlayers = [...state.players, sanitizedPlayer];
          }
          const guilds = Array.from(
            new Set(newPlayers.map((p) => p.GuildName).filter(Boolean)),
          ) as string[];
          const alliances = Array.from(
            new Set(newPlayers.map((p) => p.AllianceName).filter(Boolean)),
          ) as string[];
          return { players: newPlayers, guilds, alliances };
        }),
      addColumn: () =>
        set((state) => {
          const newId = Date.now();
          return {
            columns: [
              ...state.columns,
              { id: newId, name: `Column ${state.columns.length + 1}`, width: 1 },
            ],
          };
        }),
      removeColumn: (id) =>
        set((state) => ({
          columns: state.columns.filter((col) => col.id !== id),
        })),
      updateColumnName: (id, name) =>
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === id ? { ...col, name } : col,
          ),
        })),
      updateColumnWidth: (id, width) =>
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === id ? { ...col, width } : col,
          ),
        })),
      updateColumnFilters: (id, filters) =>
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === id ? { ...col, ...filters } : col,
          ),
        })),
    }),
    {
      name: "player-store-storage",
      partialize: (state) => ({ columns: state.columns }),
    }
  )
);
