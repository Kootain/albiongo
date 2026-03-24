import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { useTranslation } from 'react-i18next';
import { PlayerBattleSummary } from '../types';
import { cn } from '../lib/utils';
import { formatWeaponName, calcKD } from '../lib/formatters';

interface WeaponPieChartProps {
  records: PlayerBattleSummary[];
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

export function WeaponPieChart({ records }: WeaponPieChartProps) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(-1);
  
  // Aggregate weapon data
  const weaponStats: Record<string, { count: number, wins: number }> = {};
  
  records.forEach(r => {
    const rawWeapon = r.Player.Equipment.MainHand?.Type || 'Unknown';
    const weaponName = formatWeaponName(rawWeapon);
    
    if (!weaponStats[weaponName]) {
      weaponStats[weaponName] = { count: 0, wins: 0 };
    }
    weaponStats[weaponName].count += 1;
    const isWin = r.TeamKills > r.TeamDeaths;
    if (isWin) {
      weaponStats[weaponName].wins += 1;
    }
  });

  const data = Object.entries(weaponStats).map(([weaponName, stats]) => ({
    name: weaponName,
    value: stats.count,
    winRate: ((stats.wins / stats.count) * 100).toFixed(0),
    rawWeapon: weaponName
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
              stroke="#0f172a"
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
    </div>
  );
}