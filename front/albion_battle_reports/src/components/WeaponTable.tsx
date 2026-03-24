import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlayerBattleSummary } from '../types';
import { cn } from '../lib/utils';
import { formatWeaponName, calcKD } from '../lib/formatters';

interface WeaponTableProps {
  records: PlayerBattleSummary[];
}

export function WeaponTable({ records }: WeaponTableProps) {
  const { t } = useTranslation();
  
  // Aggregate weapon data
  const weaponStats: Record<string, { count: number, wins: number, kills: number, deaths: number }> = {};
  
  records.forEach(r => {
    const rawWeapon = r.Player.Equipment.MainHand?.Type || 'Unknown';
    const weaponName = formatWeaponName(rawWeapon);
    
    if (!weaponStats[weaponName]) {
      weaponStats[weaponName] = { count: 0, wins: 0, kills: 0, deaths: 0 };
    }
    weaponStats[weaponName].count += 1;
    weaponStats[weaponName].kills += r.Kills;
    weaponStats[weaponName].deaths += r.Deaths;
    const isWin = r.TeamKills > r.TeamDeaths;
    if (isWin) {
      weaponStats[weaponName].wins += 1;
    }
  });

  const data = Object.entries(weaponStats).map(([weaponName, stats]) => ({
    name: weaponName,
    value: stats.count,
    winRate: ((stats.wins / stats.count) * 100).toFixed(0),
    kills: stats.kills,
    deaths: stats.deaths,
    kd: calcKD(stats.kills, stats.deaths),
    rawWeapon: weaponName
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
  const MAX_LEGEND_ITEMS = 30;
  const limitedData = data.slice(0, MAX_LEGEND_ITEMS);
  const hasMore = data.length > MAX_LEGEND_ITEMS;

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto w-full mt-4">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-400 bg-slate-900/50 border-y border-slate-800">
          <tr>
            <th className="px-3 py-2">{t('chart.weaponName', { defaultValue: 'Weapon' })}</th>
            <th className="px-3 py-2 text-center">{t('chart.usedTimes', { defaultValue: 'Uses' })}</th>
            <th className="px-3 py-2 text-center">{t('chart.kills', { defaultValue: 'Kills' })}</th>
            <th className="px-3 py-2 text-center">{t('chart.deaths', { defaultValue: 'Deaths' })}</th>
            <th className="px-3 py-2 text-right">{t('chart.winRateTable', { defaultValue: 'Win Rate' })} (K/D)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {limitedData.map((entry, index) => (
            <tr key={`row-${index}`} className="hover:bg-slate-800/30 transition-colors">
              <td className="px-3 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-slate-200 truncate max-w-[140px] sm:max-w-[200px]" title={entry.name}>
                  {entry.name}
                </span>
              </td>
              <td className="px-3 py-2 text-center text-slate-300 font-medium">
                {entry.value}
              </td>
              <td className="px-3 py-2 text-center text-emerald-400 font-medium">
                {entry.kills}
              </td>
              <td className="px-3 py-2 text-center text-rose-400 font-medium">
                {entry.deaths}
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "font-medium", 
                    Number(entry.winRate) >= 50 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {entry.winRate}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">KD: {entry.kd}</span>
                </div>
              </td>
            </tr>
          ))}
          {hasMore && (
            <tr>
              <td colSpan={5} className="px-3 py-3 text-center text-xs text-slate-500 italic">
                +{data.length - MAX_LEGEND_ITEMS} {t('chart.more', { defaultValue: 'more weapons' })}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}