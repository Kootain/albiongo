import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { useTranslation } from 'react-i18next';
import { PlayerBattleSummary } from '../types';
import { cn } from '../lib/utils';
import { formatWeaponName, calcKD } from '../lib/formatters';

interface WeaponChartProps {
  records: PlayerBattleSummary[];
  key?: React.Key;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ outline: 'none', filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
        style={{ outline: 'none', opacity: 0.5 }}
      />
    </g>
  );
};

export function WeaponChart({ records }: WeaponChartProps) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(-1);
  
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
    kills: stats.kills,
    deaths: stats.deaths,
    kd: calcKD(stats.kills, stats.deaths),
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

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              stroke="#0f172a" // Match bg-slate-950 to act as a nice separator
              strokeWidth={2}
              isAnimationActive={true}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  style={{ outline: 'none', cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Weapon Stats Table */}
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
    </div>
  );
}
