import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  key?: React.Key;
}

export function StatCard({ title, value, subtext, icon }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className="p-2 bg-slate-800/50 rounded-lg">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-500">{subtext}</div>
    </div>
  );
}
