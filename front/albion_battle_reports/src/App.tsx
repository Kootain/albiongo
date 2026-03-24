/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Swords, Shield, Target, Users, TrendingUp, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AvalonBattlePerformance } from './types';
import { loadGameData } from './lib/dataManager';
import { calcKD } from './lib/formatters';
import { StatCard } from './components/StatCard';
import { WeaponChart } from './components/WeaponChart';
import { BattleCard } from './components/BattleCard';

export default function App() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AvalonBattlePerformance | null>(null);
  const [error, setError] = useState('');

  // Initial load: parse URL for player name
  useEffect(() => {
    loadGameData();
    
    const checkUrlAndSearch = () => {
      // e.g. /player/JohnDoe or just /?player=JohnDoe
      // Let's use search params: /?player=JohnDoe for simplicity and easier sharing
      const params = new URLSearchParams(window.location.search);
      const playerFromUrl = params.get('player');
      
      if (playerFromUrl) {
        setSearchQuery(playerFromUrl);
        // We cannot rely on searchQuery state here since it's asynchronous
        // We'll call performSearch with the URL value directly
        performSearch(playerFromUrl);
      } else {
        // Clear state if url is empty
        setSearchQuery('');
        setData(null);
        setError('');
      }
    };

    checkUrlAndSearch();

    // Listen to browser back/forward buttons
    window.addEventListener('popstate', checkUrlAndSearch);
    return () => window.removeEventListener('popstate', checkUrlAndSearch);
  }, []); // Empty dependency array to run once on mount

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const performSearch = async (playerName: string) => {
    if (!playerName.trim()) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';
      const response = await fetch(`${apiUrl}/api/v1/performance?player=${encodeURIComponent(playerName)}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const result: AvalonBattlePerformance = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
      setError(t('app.errorFetch'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Update URL without reloading the page
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('player', searchQuery.trim());
    window.history.pushState({}, '', newUrl);

    await performSearch(searchQuery.trim());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Header & Search */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Swords className="w-8 h-8 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">{t('app.title')}</h1>
          </div>
          
          <form onSubmit={handleSearch} className="w-full sm:w-auto relative flex items-center gap-4">
            <div className="relative flex items-center w-full sm:w-auto">
              <Search className="absolute left-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={t('app.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 bg-slate-800/50 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                disabled={loading}
              />
              <button 
                type="submit" 
                disabled={loading || !searchQuery.trim()}
                className="absolute right-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('app.searchButton')}
              </button>
            </div>
            <button
              type="button"
              onClick={toggleLanguage}
              className="p-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-full text-slate-300 transition-colors shrink-0 flex items-center justify-center"
              title="Toggle Language"
            >
              <Languages className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-400 animate-pulse">{t('app.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center text-red-400">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Target className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">{t('app.emptyTitle')}</h2>
            <p className="text-slate-400 max-w-md">
              {t('app.emptyDesc')}
            </p>
          </div>
        )}

        {/* Dashboard */}
        {data && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Player Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
                {data.PlayerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{data.PlayerName}</h2>
                <p className="text-slate-400">{data.BattleCnt} {t('app.battleUnit')}{t('app.recentBattles')}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title={t('app.winRate')} 
                value={`${((data.WinCnt / data.BattleCnt) * 100).toFixed(1)}%`}
                subtext={`${data.WinCnt} ${t('app.wins')} - ${data.LoseCnt} ${t('app.losses')}`}
                icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
              />
              <StatCard 
                title={t('app.personalKD')} 
                value={calcKD(data.Kills, data.Deaths)}
                subtext={`${data.Kills} ${t('app.kills')} / ${data.Deaths} ${t('app.deaths')}`}
                icon={<Target className="w-5 h-5 text-indigo-400" />}
              />
              <StatCard 
                title={t('app.teamKD')} 
                value={calcKD(data.TeamKills, data.TeamDeaths)}
                subtext={`${data.TeamKills} ${t('app.kills')} / ${data.TeamDeaths} ${t('app.deaths')}`}
                icon={<Users className="w-5 h-5 text-blue-400" />}
              />
              <StatCard 
                title={t('app.avgTeamIP')} 
                value={Math.round(
                  data.BattleRecords.reduce((acc, r) => {
                    const teamAvg = r.TeamMembers.reduce((sum, m) => sum + m.AverageItemPower, 0) / (r.TeamMembers.length || 1);
                    return acc + teamAvg;
                  }, 0) / data.BattleRecords.length
                ).toString()}
                subtext={t('app.acrossBattles')}
                icon={<Shield className="w-5 h-5 text-amber-400" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Weapon Usage Pie Chart */}
              <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
                <h3 className="text-lg font-semibold text-white mb-6">{t('app.weaponUsage')}</h3>
                <WeaponChart records={data.BattleRecords} />
              </div>

              {/* Battle History */}
              <div className="lg:col-span-3 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">{t('app.recentBattles')}</h3>
                <div className="space-y-3">
                  {[...data.BattleRecords]
                    .sort((a, b) => new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime())
                    .map((record) => (
                      <BattleCard key={record.BattleID} record={record} />
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

