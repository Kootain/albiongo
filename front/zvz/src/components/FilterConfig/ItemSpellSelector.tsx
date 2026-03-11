import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, Search } from "lucide-react";
import { getAllItems, getAllSpells, getLocalizedText } from "../../utils/dataManager";
import { ItemData, SpellData } from "../../types";

interface ItemSpellSelectorProps {
  onSelect: (name: string, id: number, uniqueId: string, type: 'item' | 'spell') => void;
  onClose: () => void;
}

type SearchResult = 
  | { type: "item"; data: ItemData }
  | { type: "spell"; data: SpellData };

export const ItemSpellSelector: React.FC<ItemSpellSelectorProps> = ({ onSelect, onClose }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  
  const allData = useMemo(() => {
    const rawItems = getAllItems();
    const uniqueItemMap = new Map<string, ItemData>();

    rawItems.forEach((item) => {
      const existing = uniqueItemMap.get(item.NameID);
      if (!existing) {
        uniqueItemMap.set(item.NameID, item);
      } else {
        // Prefer item with description
        const hasDesc = (i: ItemData) => 
          i.Description && Object.values(i.Description).some(v => v && v.length > 0);
        
        if (!hasDesc(existing) && hasDesc(item)) {
          uniqueItemMap.set(item.NameID, item);
        }
      }
    });

    const items = Array.from(uniqueItemMap.values()).map(item => ({ type: "item" as const, data: item }));
    const spells = getAllSpells().map(spell => ({ type: "spell" as const, data: spell }));
    return [...items, ...spells];
  }, []);

  const results = useMemo(() => {
    if (!searchTerm) return [];
    const lowerTerm = searchTerm.toLowerCase();
    return allData.filter(entry => {
      const name = getLocalizedText(entry.data.Name).toLowerCase();
      const id = entry.data.Index.toString();
      return name.includes(lowerTerm) || id.includes(lowerTerm);
    }).slice(0, 50); // Limit results
  }, [searchTerm, allData]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-zinc-100">{t("Select Item or Spell")}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("Search by name or ID...")}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {results.map((entry) => {
            const name = getLocalizedText(entry.data.Name);
            const id = entry.data.Index;
            const desc = entry.data.Description ? getLocalizedText(entry.data.Description) : "";
            const uniqueId = entry.type === 'item' ? entry.data.NameID : entry.data.UniqueName;
            
            return (
              <div
                key={`${entry.type}-${id}`}
                className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 hover:border-indigo-500/50 hover:bg-zinc-800 transition-colors cursor-pointer group"
                onClick={() => onSelect(name, id, uniqueId, entry.type)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors">
                      {name}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 line-clamp-1">{desc}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                      entry.type === 'item' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {entry.type}
                    </span>
                    <span className="text-xs text-zinc-600 font-mono">#{id}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {searchTerm && results.length === 0 && (
            <div className="text-center text-zinc-500 py-8">
              {t("No results found")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
