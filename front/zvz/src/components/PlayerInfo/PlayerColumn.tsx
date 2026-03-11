import React, { useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePlayerStore, PlayerColumnConfig } from "../../store/usePlayerStore";
import { PlayerCard } from "./PlayerCard";
import { X, Search, ChevronDown, ChevronRight, Check, Filter } from "lucide-react";
import { FilterInput } from "./FilterInput";

import { ItemSpellSelector } from "../FilterConfig/ItemSpellSelector";

import { getItem, getWeaponType, getLocalizedText } from "../../utils/dataManager";

interface PlayerColumnProps {
  config: PlayerColumnConfig;
  onRemove: () => void;
}

export const PlayerColumn: React.FC<PlayerColumnProps> = ({ config, onRemove }) => {
  const { t } = useTranslation();
  const players = usePlayerStore((state) => state.players);
  const guilds = usePlayerStore((state) => state.guilds);
  const alliances = usePlayerStore((state) => state.alliances);
  const updateColumnName = usePlayerStore((state) => state.updateColumnName);
  const updateColumnWidth = usePlayerStore((state) => state.updateColumnWidth);
  const updateColumnFilters = usePlayerStore((state) => state.updateColumnFilters);

  const filterGuild = config.filterGuild || "";
  const filterAlliance = config.filterAlliance || "";
  const searchName = config.searchName || "";
  const searchItem = config.searchItem || "";
  const minPLevel = config.minPLevel || 0;
  const sortByWeapon = config.sortByWeapon || false;
  const sortByWeaponType = config.sortByWeaponType || false;

  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);
  const [isItemSelectorOpen, setIsItemSelectorOpen] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [showWidthMenu, setShowWidthMenu] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const filteredPlayers = useMemo(() => {
    const result = players.filter((p) => {
      if (filterGuild) {
        const guilds = filterGuild.split(',');
        if (!guilds.includes(p.GuildName)) return false;
      }
      if (filterAlliance) {
        const alliances = filterAlliance.split(',');
        if (!alliances.includes(p.AllianceName)) return false;
      }
      if (
        searchName &&
        !p.Name.toLowerCase().includes(searchName.toLowerCase())
      )
        return false;

      if (searchItem) {
        const searchItemLower = searchItem.toLowerCase();
        const hasItem = (p.Equipments || []).some(id => {
          if (!id) return false;
          const item = getItem(id);
          if (!item) return false;
          const name = getLocalizedText(item.Name);
          return name.toLowerCase().includes(searchItemLower);
        });
        if (!hasItem) return false;
      }

      if (minPLevel > 0) {
        const weaponId = (p.Equipments || [])[0];
        if (!weaponId) return false;
        const item = getItem(weaponId);
        if (!item) return false;
        const pLevel = item.Tier + item.Enchant;
        if (pLevel < minPLevel) return false;
      }

      return true;
    });

    if (sortByWeapon) {
      return result.sort((a, b) => {
        const weaponA = (a.Equipments || [])[0] || 0;
        const weaponB = (b.Equipments || [])[0] || 0;
        return weaponB - weaponA; 
      });
    }

    if (sortByWeaponType) {
        return result.sort((a, b) => {
            const getWType = (p: typeof a) => {
                const wid = (p.Equipments || [])[0];
                if (!wid) return "ZZZ"; // Put unknown at the end
                const item = getItem(wid);
                if (!item) return "ZZZ";
                const nameZH = item.Name && item.Name['ZH-CN'] ? item.Name['ZH-CN'] : '';
                return getWeaponType(nameZH) || "ZZZ";
            };
            
            const typeA = getWType(a);
            const typeB = getWType(b);
            
            // Custom order: Tank -> Healer -> Support -> Melee DPS -> Ranged DPS -> Others
            const typeOrder: Record<string, number> = {
                "坦克": 1,
                "治疗": 2,
                "辅助": 3,
                "近战输出": 4,
                "远程输出": 5
            };
            
            const orderA = typeOrder[typeA] || 999;
            const orderB = typeOrder[typeB] || 999;
            
            if (orderA !== orderB) return orderA - orderB;
            
            // Secondary sort by weapon ID if types match
            const weaponA = (a.Equipments || [])[0] || 0;
            const weaponB = (b.Equipments || [])[0] || 0;
            return weaponB - weaponA;
        });
    }

    return result;
  }, [players, filterGuild, filterAlliance, searchName, sortByWeapon, sortByWeaponType]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(config.name);
    setIsEditingName(true);
  };

  const handleNameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateColumnName(config.id, editName);
    setIsEditingName(false);
  };

  const handleEdgePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    timerRef.current = setTimeout(() => {
      setShowWidthMenu(true);
    }, 500);
  };

  const handleEdgePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleEdgePointerLeave = (e: React.PointerEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const getWidthClass = (width: number) => {
    switch (width) {
      case 5: return "w-[1504px]";
      case 4: return "w-[1208px]";
      case 3: return "w-[912px]";
      case 2: return "w-[616px]";
      case 1:
      default: return "w-80";
    }
  };

  const getPlayerGridClass = (width: number) => {
    switch (width) {
      case 5: return "grid grid-cols-5 gap-2 content-start";
      case 4: return "grid grid-cols-4 gap-2 content-start";
      case 3: return "grid grid-cols-3 gap-2 content-start";
      case 2: return "grid grid-cols-2 gap-2 content-start";
      case 1:
      default: return "space-y-2";
    }
  };

  const getFilterGridClass = (width: number) => {
    if (width >= 3) return "grid-cols-5";
    if (width === 2) return "grid-cols-3";
    return "grid-cols-1";
  };

  const widthClass = getWidthClass(config.width);

  const filterSummary = [
    searchName ? `S: ${searchName}` : null,
    searchItem ? `I: ${searchItem}` : null,
    minPLevel > 0 ? `P >= ${minPLevel}` : null,
    filterGuild ? `G: ${filterGuild}` : null,
    filterAlliance ? `A: ${filterAlliance}` : null,
  ].filter(Boolean).join(", ");

  return (
    <div className={`flex flex-col flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 overflow-visible h-full relative transition-all duration-200 ${widthClass}`}>
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/50">
        {isEditingName ? (
          <form onSubmit={handleNameSubmit} className="flex-1 mr-4" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => handleNameSubmit()}
              className="w-full bg-zinc-950 text-white font-semibold px-2 py-1 rounded border border-indigo-500 focus:outline-none"
              placeholder={t("Enter name")}
            />
          </form>
        ) : (
          <h3 
            className="font-semibold text-zinc-100 cursor-text flex-1"
            onDoubleClick={handleDoubleClick}
            title={t("Double click to edit")}
          >
            {config.name}
          </h3>
        )}
        <button
          onClick={onRemove}
          className="text-zinc-400 hover:text-red-400 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <button
          type="button"
          onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
          className="w-full flex items-center justify-between p-3 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          title={isFiltersCollapsed && filterSummary ? filterSummary : t("Filters")}
        >
          <div className="flex items-center space-x-2 overflow-hidden text-left">
            <Filter size={16} className="flex-shrink-0" />
            {isFiltersCollapsed && filterSummary && (
              <span className="text-xs text-zinc-500 truncate font-normal">
                {filterSummary}
              </span>
            )}
          </div>
          {isFiltersCollapsed ? <ChevronRight size={16} className="flex-shrink-0 ml-2" /> : <ChevronDown size={16} className="flex-shrink-0 ml-2" />}
        </button>
        
        {!isFiltersCollapsed && (
          <div className="px-4 pb-4 space-y-3">
            <div className={`grid gap-3 ${getFilterGridClass(config.width)}`}>
              <div className="relative">
                <FilterInput
                  placeholder={t("Search Player")}
                  value={searchName}
                  onChange={(val) => updateColumnFilters(config.id, { searchName: String(val) })}
                  suggestions={players.map((p) => p.Name)}
                  onClear={() => updateColumnFilters(config.id, { searchName: "" })}
                />
              </div>

              <div className="relative max-w-[240px]">
                <FilterInput
                  placeholder={t("Filter by Equipment")}
                  value={searchItem}
                  onChange={(val) => updateColumnFilters(config.id, { searchItem: String(val) })}
                  readOnly={true}
                  onClick={() => setIsItemSelectorOpen(true)}
                  onClear={() => updateColumnFilters(config.id, { searchItem: "" })}
                />
              </div>

              <div className="relative">
                <FilterInput
                  placeholder={t("Guild")}
                  value={filterGuild}
                  onChange={(val) => updateColumnFilters(config.id, { filterGuild: String(val) })}
                  suggestions={guilds}
                  multiSelect={true}
                  onClear={() => updateColumnFilters(config.id, { filterGuild: "" })}
                />
              </div>

              <div className="relative">
                <FilterInput
                  placeholder={t("Alliance")}
                  value={filterAlliance}
                  onChange={(val) => updateColumnFilters(config.id, { filterAlliance: String(val) })}
                  suggestions={alliances}
                  multiSelect={true}
                  onClear={() => updateColumnFilters(config.id, { filterAlliance: "" })}
                />
              </div>

              <div className="relative">
                <FilterInput
                  type="number"
                  placeholder={t("Min P-Level")}
                  value={minPLevel || 0}
                  onChange={(val) => updateColumnFilters(config.id, { minPLevel: Number(val) })}
                  onClear={() => updateColumnFilters(config.id, { minPLevel: 0 })}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                className="flex items-center justify-between flex-1 max-w-[140px] px-3 py-2 text-sm rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 transition-colors group"
                onClick={() => updateColumnFilters(config.id, { sortByWeapon: !sortByWeapon, sortByWeaponType: false })}
              >
                <span className="text-zinc-400 group-hover:text-zinc-200 truncate mr-2">{t("Sort by Weapon ID")}</span>
                <div className={`w-8 h-4 rounded-full relative transition-colors flex-shrink-0 ${sortByWeapon ? "bg-indigo-600" : "bg-zinc-700"}`}>
                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${sortByWeapon ? "translate-x-4" : ""}`} />
                </div>
              </button>

              <button 
                className="flex items-center justify-between flex-1 max-w-[140px] px-3 py-2 text-sm rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 transition-colors group"
                onClick={() => updateColumnFilters(config.id, { sortByWeaponType: !sortByWeaponType, sortByWeapon: false })}
              >
                <span className="text-zinc-400 group-hover:text-zinc-200 truncate mr-2">{t("Sort by Weapon Type")}</span>
                <div className={`w-8 h-4 rounded-full relative transition-colors flex-shrink-0 ${sortByWeaponType ? "bg-indigo-600" : "bg-zinc-700"}`}>
                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${sortByWeaponType ? "translate-x-4" : ""}`} />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${getPlayerGridClass(config.width)}`}>
        {filteredPlayers.map((player) => (
          <PlayerCard key={player.Name} player={player} />
        ))}
        {filteredPlayers.length === 0 && (
          <div className={`text-center text-zinc-500 text-sm py-8 ${config.width > 1 ? `col-span-${config.width}` : ''}`}>
            {t("No players found")}
          </div>
        )}
      </div>

      {/* Right edge for resizing */}
      <div
        className="absolute top-0 right-0 w-4 h-full cursor-col-resize hover:bg-white/10 transition-colors z-10"
        onPointerDown={handleEdgePointerDown}
        onPointerUp={handleEdgePointerUp}
        onPointerLeave={handleEdgePointerLeave}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      />

      {showWidthMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={(e) => { e.stopPropagation(); setShowWidthMenu(false); }} 
          />
          <div 
            className="absolute top-1/2 right-6 -translate-y-1/2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {[1, 2, 3, 4, 5].map((span) => (
              <button
                key={span}
                className={`px-4 py-2 text-sm text-left hover:bg-zinc-700 transition-colors flex items-center justify-between ${
                  config.width === span ? "text-indigo-400 font-medium" : "text-zinc-300"
                }`}
                onClick={() => {
                  updateColumnWidth(config.id, span);
                  setShowWidthMenu(false);
                }}
              >
                <span>{span} {t("Column")}{span > 1 ? "s" : ""}</span>
                {config.width === span && <Check size={14} className="ml-2" />}
              </button>
            ))}
          </div>
        </>
      )}
      
      {isItemSelectorOpen && (
        <ItemSpellSelector
          onSelect={(name) => {
            updateColumnFilters(config.id, { searchItem: name });
            setIsItemSelectorOpen(false);
          }}
          onClose={() => setIsItemSelectorOpen(false)}
        />
      )}
    </div>
  );
};
