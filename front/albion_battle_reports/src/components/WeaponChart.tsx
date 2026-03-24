import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { PlayerBattleSummary } from '../types';
import { cn } from '../lib/utils';
import { formatWeaponName } from '../lib/formatters';

interface WeaponChartProps {
  records: PlayerBattleSummary[];
  key?: React.Key;
}

export function WeaponChart({ records }: WeaponChartProps) {
  const { t } = useTranslation();
  
  // Aggregate weapon data
  const weaponStats: Record<string, { count: number, wins: number }> = {};
  
  records.forEach(r => {
    const rawWeapon = r.Player.Equipment.MainHand?.Type || 'Unknown';
    const weaponName = formatWeaponName(rawWeapon);
    
    if (!weaponStats[weaponName]) {
      weaponStats[weaponName] = { count: 0, wins: 0 };
    }
    weaponStats[weaponName].count += 1;
    // Determine win by checking if deaths are lower than a threshold, or we can just infer from team KD
    // Actually, we don't have explicit win/loss per battle in the summary struct directly, 
    // but we can infer it. Let's assume a win if TeamKills > TeamDeaths for now, or we can just pass it if we add it.
    // Wait, the mock data generates win/loss implicitly. Let's infer win if TeamKills > TeamDeaths.
    const isWin = r.TeamKills > r.TeamDeaths;
    if (isWin) {
      weaponStats[weaponName].wins += 1;
    }
  });

  const data = Object.entries(weaponStats).map(([weaponName, stats]) => ({
    name: weaponName,
    value: stats.count,
    winRate: ((stats.wins / stats.count) * 100).toFixed(0),
    rawWeapon: weaponName // keep field name for compatibility, though it's formatted now
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="font-semibold text-white mb-1">{data.name}</p>
          <p className="text-sm text-slate-300">{t('chart.used')}: <span className="text-white font-medium">{data.value} {t('chart.times')}</span></p>
          <p className="text-sm text-slate-300">{t('chart.winRate')}: <span className={cn("font-medium", Number(data.winRate) >= 50 ? "text-emerald-400" : "text-rose-400")}>{data.winRate}%</span></p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-500">{t('chart.noData')}</div>;
  }

  // Adjust container height dynamically based on number of legend items to prevent overflow
  // We'll limit the legend to top 10 items to keep UI clean, so max height is predictable
  const MAX_LEGEND_ITEMS = 30;
  const limitedData = data.slice(0, MAX_LEGEND_ITEMS);
  const hasMore = data.length > MAX_LEGEND_ITEMS;

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend Rendered outside Recharts to allow natural DOM flow and wrap */}
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-3 text-xs w-full">
        {limitedData.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center text-slate-300">
            <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="truncate max-w-[120px]" title={entry.name}>{entry.name}</span> 
            <span className="ml-1 shrink-0">({entry.winRate}%)</span>
          </li>
        ))}
        {hasMore && (
          <li className="flex items-center text-slate-500 italic ml-2">
            +{data.length - MAX_LEGEND_ITEMS} {t('chart.more', { defaultValue: 'more' })}
          </li>
        )}
      </ul>
    </div>
  );
}
