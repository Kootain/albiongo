import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
}

export function StatCard({ title, value, subtext, icon }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-6 hover:border-slate-700 transition-colors h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-medium text-slate-400 truncate mr-2" title={title}>{title}</h3>
        <div className="p-1.5 sm:p-2 bg-slate-800 rounded-lg shrink-0">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-lg sm:text-3xl font-bold text-white mb-1 tracking-tight">{value}</div>
        <div className="text-[10px] sm:text-sm text-slate-500 font-medium truncate" title={subtext}>{subtext}</div>
      </div>
    </div>
  );
}
