import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useEventStore } from "../../store/useEventStore";
import { useMonitorStore, BlockAssignment } from "../../store/useMonitorStore";
import { getSpell, getLocalizedText } from "../../utils/dataManager";
import { X, Check, Plus } from "lucide-react";
import { FilterStrategyEditor } from "./FilterStrategyEditor";
import { FilterStrategyConfig } from "../../filters/skillUseFilters";

interface ColorBlockProps {
  blockId: string;
}

export const ColorBlock: React.FC<ColorBlockProps> = ({ blockId }) => {
  const { t } = useTranslation();
  const block = useMonitorStore((state) =>
    state.blocks.find((b) => b.id === blockId),
  );
  const removeAssignment = useMonitorStore((state) => state.removeAssignment);
  const updateBlockName = useMonitorStore((state) => state.updateBlockName);
  const updateBlockColSpan = useMonitorStore((state) => state.updateBlockColSpan);
  const addFilterStrategy = useMonitorStore((state) => state.addFilterStrategy);
  const updateFilterStrategy = useMonitorStore((state) => state.updateFilterStrategy);
  const removeFilterStrategy = useMonitorStore((state) => state.removeFilterStrategy);
  const activeTrigger = useEventStore((state) => state.activeTriggers[blockId]);

  const [showModal, setShowModal] = useState(false);
  const [isLit, setIsLit] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [showWidthMenu, setShowWidthMenu] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeTrigger) {
      if (activeTrigger.flashing) {
        setIsFlashing(true);
        setIsLit(false);
        const timer1 = setTimeout(() => {
          setIsFlashing(false);
          setIsLit(true);
        }, 200);
        const timer2 = setTimeout(() => {
          setIsLit(false);
        }, 1200);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      } else {
        setIsLit(true);
        const timer = setTimeout(() => {
          setIsLit(false);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTrigger]);

  if (!block) return null;

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(block.name || "");
    setIsEditingName(true);
  };

  const handleNameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateBlockName(blockId, editName);
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

  const handleAddStrategy = () => {
    const newStrategy: FilterStrategyConfig = {
      id: Date.now().toString(),
      rules: [],
    };
    addFilterStrategy(blockId, newStrategy);
  };

  return (
    <>
      <div
        className={`w-full h-full rounded-lg cursor-pointer transition-all duration-100 flex items-center justify-center relative overflow-visible`}
        style={{
          backgroundColor: isLit ? block.color : "#333",
          boxShadow: isLit ? `0 0 20px ${block.color}` : "none",
          opacity: isFlashing ? 0 : 1,
          gridColumn: `span ${block.colSpan || 1}`,
        }}
        onClick={() => {
          if (!isEditingName) setShowModal(true);
        }}
        onDoubleClick={handleDoubleClick}
      >
        <div
          className="absolute top-2 left-2 w-4 h-4 rounded-full"
          style={{ backgroundColor: block.color }}
        />
        
        {isEditingName ? (
          <form onSubmit={handleNameSubmit} className="z-10 w-3/4" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => handleNameSubmit()}
              className="w-full bg-zinc-900 text-white text-center font-bold px-2 py-1 rounded border border-indigo-500 focus:outline-none"
              placeholder={t("Enter name")}
            />
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center pointer-events-none">
            {block.name && (
              <span className="text-white font-bold text-lg mb-1 drop-shadow-md">
                {block.name}
              </span>
            )}
            <span className="text-white font-bold opacity-50 text-sm">
              {block.assignments.length + (block.filterStrategies?.length || 0)} {t("Assignments")}
            </span>
          </div>
        )}

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
              {[1, 2, 3].map((span) => (
                <button
                  key={span}
                  className={`px-4 py-2 text-sm text-left hover:bg-zinc-700 transition-colors flex items-center justify-between ${
                    (block.colSpan || 1) === span ? "text-indigo-400 font-medium" : "text-zinc-300"
                  }`}
                  onClick={() => {
                    updateBlockColSpan(blockId, span);
                    setShowWidthMenu(false);
                  }}
                >
                  <span>{span} {t("Column")}{span > 1 ? "s" : ""}</span>
                  {(block.colSpan || 1) === span && <Check size={14} className="ml-2" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-zinc-800 p-6 rounded-xl w-96 max-w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                {block.name || t("Assignments")}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 flex items-center space-x-2">
              <label className="text-sm text-zinc-400">Color:</label>
              <input
                type="color"
                value={block.color}
                onChange={(e) =>
                  useMonitorStore
                    .getState()
                    .updateBlockColor(blockId, e.target.value)
                }
                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                title="Change block color"
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-zinc-300">{t("Filter Strategies")}</h4>
                <button
                  onClick={handleAddStrategy}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-xs"
                >
                  <Plus size={14} /> {t("Add Strategy")}
                </button>
              </div>
              
              {(!block.filterStrategies || block.filterStrategies.length === 0) ? (
                <p className="text-xs text-zinc-500 italic mb-4">{t("No filter strategies configured.")}</p>
              ) : (
                <div className="space-y-3">
                  {block.filterStrategies.map((strategy) => (
                    <FilterStrategyEditor
                      key={strategy.id}
                      strategy={strategy}
                      onChange={(newStrategy) => updateFilterStrategy(blockId, strategy.id, newStrategy)}
                      onRemove={() => removeFilterStrategy(blockId, strategy.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-zinc-300 mb-2">{t("Legacy Assignments")}</h4>
              {block.assignments.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">{t("No legacy assignments")}</p>
              ) : (
                <ul className="space-y-2">
                  {block.assignments.map((assignment, idx) => {
                    const spell = getSpell(assignment.spellId);
                    return (
                      <li
                        key={idx}
                        className="flex justify-between items-center bg-zinc-700 p-2 rounded"
                      >
                        <div>
                          <div className="text-sm font-medium text-white">
                            {assignment.playerName}
                          </div>
                          <div className="text-xs text-gray-300">
                            {spell ? getLocalizedText(spell.Name) : `Spell ${assignment.spellId}`}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            removeAssignment(
                              blockId,
                              assignment.playerName,
                              assignment.spellId,
                            )
                          }
                          className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-400/10 rounded"
                        >
                          {t("Delete")}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
