import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Player } from "../../types";
import { getItem, getSpell, getLocalizedText } from "../../utils/dataManager";
import { useMonitorStore } from "../../store/useMonitorStore";
import { X } from "lucide-react";

interface PlayerDetailsModalProps {
  player: Player;
  onClose: () => void;
}

export const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({ player, onClose }) => {
  const { t } = useTranslation();
  const [activeSpell, setActiveSpell] = useState<number | null>(null);
  const { rows, cols, blocks, addAssignment } = useMonitorStore();

  const slotNames = [
    "Main Hand",
    "Off Hand",
    "Head",
    "Chest",
    "Shoes",
    "Bag",
    "Cape",
    "Mount",
    "Potion",
    "Food",
  ];

  const handleAssign = (blockId: string, spellId: number) => {
    addAssignment(blockId, {
      playerName: player.Name,
      spellId,
    });
    setActiveSpell(null);
  };

  // Map equipment index to spell indices
  const getSpellsForSlot = (slotIndex: number) => {
    const spells = player.Spells || [];
    switch (slotIndex) {
      case 0: // Main Hand
        return [spells[0], spells[1], spells[2]];
      case 2: // Head
        return [spells[4]];
      case 3: // Chest
        return [spells[3]];
      case 4: // Shoes
        return [spells[5]];
      case 8: // Potion
        return [spells[12]];
      case 9: // Food
        return [spells[13]];
      default:
        return [];
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-zinc-900 z-10 pb-2 border-b border-zinc-800">
          <div>
            <h3 className="text-xl font-bold text-zinc-100">{player.Name}</h3>
            <div className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
              {player.AllianceName && (
                <span className="px-1.5 py-0.5 bg-zinc-950 rounded text-zinc-300">
                  [{player.AllianceName}]
                </span>
              )}
              <span>{player.GuildName}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {(player.Equipments || []).map((eqId, idx) => {
            if (eqId <= 0) return null;
            const item = getItem(eqId);
            const slotSpells = getSpellsForSlot(idx).filter(id => id > 0);

            return (
              <div key={idx} className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50 flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3 flex flex-col justify-center">
                  <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">
                    {t(slotNames[idx] || `Slot ${idx}`)}
                  </span>
                  <span className="text-zinc-200 text-sm font-medium">
                    {item ? `${item.Tier}.${item.Enchant} ${getLocalizedText(item.Name)}` : `Item ${eqId}`}
                  </span>
                </div>
                
                {slotSpells.length > 0 && (
                  <div className="w-full sm:w-2/3 flex flex-wrap gap-2 items-center border-t sm:border-t-0 sm:border-l border-zinc-800/50 pt-3 sm:pt-0 sm:pl-4">
                    {slotSpells.map((spellId, sIdx) => {
                      const spell = getSpell(spellId);
                      const isSelecting = activeSpell === spellId;
                      
                      return (
                        <div key={sIdx} className="relative">
                          <button
                            onClick={() => setActiveSpell(isSelecting ? null : spellId)}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                              isSelecting 
                                ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" 
                                : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
                            }`}
                          >
                            {spell ? getLocalizedText(spell.Name) : `Spell ${spellId}`}
                          </button>
                          
                          {isSelecting && (
                            <div className="absolute z-50 mt-2 left-0 sm:left-auto sm:right-0 bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-2xl w-56">
                              <div className="text-xs font-medium text-zinc-400 mb-3">{t("Assign to Block")}</div>
                              <div 
                                className="grid gap-1.5"
                                style={{
                                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                                  gridAutoRows: `minmax(0, 1fr)`,
                                }}
                              >
                                {blocks.map((block) => (
                                  <button
                                    key={block.id}
                                    onClick={() => handleAssign(block.id, spellId)}
                                    className="w-full rounded-md hover:scale-110 transition-transform shadow-sm"
                                    style={{ 
                                      backgroundColor: block.color,
                                      gridColumn: `span ${block.colSpan || 1}`,
                                      aspectRatio: `${block.colSpan || 1} / 1`
                                    }}
                                    title={`Assign to ${block.name || block.id}`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
