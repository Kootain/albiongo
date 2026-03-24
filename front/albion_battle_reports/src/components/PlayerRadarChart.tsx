import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { RoleScore } from '../types';

interface PlayerRadarChartProps {
  scores: RoleScore[];
}

export function PlayerRadarChart({ scores }: PlayerRadarChartProps) {
  const { t } = useTranslation();

  if (!scores || scores.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-500">{t('chart.noData')}</div>;
  }

  const data = scores.map(s => ({
    subject: t(`roles.${s.Role}`, { defaultValue: s.Role }),
    A: Math.round(s.Score),
    fullMark: 100,
  }));

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Score"
              dataKey="A"
              stroke="#6366f1"
              fill="#8b5cf6"
              fillOpacity={0.5}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem' }}
              itemStyle={{ color: '#818cf8' }}
              formatter={(value: number) => [`${value}`, t('chart.score', { defaultValue: 'Score' })]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}