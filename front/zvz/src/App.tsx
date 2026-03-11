import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SkillMonitor } from "./components/SkillMonitor/SkillMonitor";
import { PlayerInfo } from "./components/PlayerInfo/PlayerInfo";
import { useWebSocket } from "./hooks/useWebSocket";
import { usePlayerStore } from "./store/usePlayerStore";
import { useMonitorStore } from "./store/useMonitorStore";
import { loadGameData } from "./utils/dataManager";
import { Monitor, Users, Globe, Plus, Filter } from "lucide-react";
import { FilterConfigPage } from "./components/FilterConfig/FilterConfigPage";
import "./i18n";

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"monitor" | "players" | "filters">("players");
  const addColumn = usePlayerStore((state) => state.addColumn);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    loadGameData()
      .then(() => setDataLoaded(true))
      .catch((err) => console.error("Failed to load game data", err));
  }, []);


  const { rows, cols, setGrid } = useMonitorStore();
  const [inputRows, setInputRows] = useState(rows);
  const [inputCols, setInputCols] = useState(cols);

  useEffect(() => {
    setInputRows(rows);
    setInputCols(cols);
  }, [rows, cols]);


  const handleApply = () => {
    setGrid(inputRows, inputCols);
  };

  useWebSocket();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "zh" ? "en" : "zh");
  };
  if (!dataLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-100 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400">Loading game data...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Albion ZvZ Monitor
          </h1>
          <nav className="flex gap-2">
            <button
              onClick={() => setActiveTab("monitor")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "monitor"
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent"
              }`}
            >
              <Monitor size={16} />
              {t("Skill Monitor")}
            </button>
            <button
              onClick={() => setActiveTab("players")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "players"
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent"
              }`}
            >
              <Users size={16} />
              {t("Player Info")}
            </button>
            <button
              onClick={() => setActiveTab("filters")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "filters"
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent"
              }`}
            >
              <Filter size={16} />
              {t("Filters")}
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {activeTab === "monitor" && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-zinc-400">{t("Rows")}</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={inputRows}
                  onChange={(e) => setInputRows(Number(e.target.value))}
                  className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-zinc-400">{t("Columns")}</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={inputCols}
                  onChange={(e) => setInputCols(Number(e.target.value))}
                  className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleApply}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                {t("Apply")}
              </button>
            </div>
          )}
          {activeTab === "players" && (
            <button
              onClick={addColumn}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              <span>{t("Add Column")}</span>
            </button>
          )}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors border border-zinc-800"
          >
            <Globe size={14} />
            {i18n.language === "zh" ? "EN" : "中文"}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {activeTab === "monitor" ? (
          <SkillMonitor />
        ) : activeTab === "players" ? (
          <PlayerInfo />
        ) : (
          <FilterConfigPage />
        )}
      </main>
    </div>
  );
}
