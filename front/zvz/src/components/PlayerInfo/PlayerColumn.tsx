import React, { useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePlayerStore, PlayerColumnConfig } from "../../store/usePlayerStore";
import { PlayerCard } from "./PlayerCard";
import { X, Search, ChevronDown, ChevronRight, Check, Filter } from "lucide-react";

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

  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [showWidthMenu, setShowWidthMenu] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (filterGuild && p.GuildName !== filterGuild) return false;
      if (filterAlliance && p.AllianceName !== filterAlliance) return false;
      if (
        searchName &&
        !p.Name.toLowerCase().includes(searchName.toLowerCase())
      )
        return false;
      return true;
    });
  }, [players, filterGuild, filterAlliance, searchName]);

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

  const widthClass = getWidthClass(config.width);

  const filterSummary = [
    searchName ? `S: ${searchName}` : null,
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
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={14}
              />
              <input
                type="text"
                list={`players-${config.id}`}
                placeholder={t("Search Player")}
                value={searchName}
                onChange={(e) => updateColumnFilters(config.id, { searchName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
              <datalist id={`players-${config.id}`}>
                {players.map((p) => (
                  <option key={p.Name} value={p.Name} />
                ))}
              </datalist>
            </div>

            <div className={`grid gap-3 ${config.width >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={14}
                />
                <input
                  list={`guilds-${config.id}`}
                  value={filterGuild}
                  onChange={(e) => updateColumnFilters(config.id, { filterGuild: e.target.value })}
                  placeholder={`${t("Guild")}`}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
                <datalist id={`guilds-${config.id}`}>
                  {guilds.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>

              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={14}
                />
                <input
                  list={`alliances-${config.id}`}
                  value={filterAlliance}
                  onChange={(e) => updateColumnFilters(config.id, { filterAlliance: e.target.value })}
                  placeholder={`${t("Alliance")}`}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
                <datalist id={`alliances-${config.id}`}>
                  {alliances.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>
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
            No players found
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
    </div>
  );
};
