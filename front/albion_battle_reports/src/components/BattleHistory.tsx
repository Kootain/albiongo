import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayerBattleSummary } from '../types';
import { BattleCard } from './BattleCard';

interface BattleHistoryProps {
  records: PlayerBattleSummary[];
}

export function BattleHistory({ records }: BattleHistoryProps) {
  const { t } = useTranslation();
  const PAGE_SIZE = 10;
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime());
  }, [records]);

  const visibleRecords = sortedRecords.slice(0, displayCount);
  const hasMore = displayCount < sortedRecords.length;

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + PAGE_SIZE, sortedRecords.length));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">{t('app.recentBattles')}</h3>
      <div className="space-y-3">
        {visibleRecords.map((record) => (
          <BattleCard key={record.BattleID} record={record} />
        ))}
      </div>
      
      {hasMore && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600"
          >
            {t('app.loadMore', { defaultValue: 'Load More' })}
          </button>
        </div>
      )}
    </div>
  );
}