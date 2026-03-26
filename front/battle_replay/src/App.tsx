import React from 'react';
import { loadGameData } from '@albion/game-data';
import { EventDrawer } from './components/EventDrawer';
import { FilterPanel } from './components/FilterPanel';
import { StatsPanel } from './components/StatsPanel';
import { TimelineCanvas } from './components/Timeline/TimelineCanvas';
import { TopBar } from './components/TopBar';
import { BarChart2, Clock } from 'lucide-react';

type ActiveView = 'timeline' | 'stats';

const App: React.FC = () => {
  React.useEffect(() => {
    loadGameData().catch(console.error);
  }, []);

  const [activeView, setActiveView] = React.useState<ActiveView>('timeline');

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-zinc-950 text-zinc-100 font-sans select-none">
      <TopBar />
      {/* 视图切换 tab */}
      <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
        <button
          onClick={() => setActiveView('timeline')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors
            ${activeView === 'timeline'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
        >
          <Clock size={12} />
          时间轴
        </button>
        <button
          onClick={() => setActiveView('stats')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors
            ${activeView === 'stats'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
        >
          <BarChart2 size={12} />
          统计
        </button>
      </div>
      <div className="flex-1 flex overflow-hidden min-h-0">
        <FilterPanel />
        {activeView === 'timeline' ? (
          <>
            <TimelineCanvas />
            <EventDrawer />
          </>
        ) : (
          <StatsPanel />
        )}
      </div>
    </div>
  );
};

export default App;
