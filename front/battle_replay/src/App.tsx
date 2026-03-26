import React from 'react';
import { loadGameData } from '@albion/game-data';
import { EventDrawer } from './components/EventDrawer';
import { FilterPanel } from './components/FilterPanel';
import { TimelineCanvas } from './components/Timeline/TimelineCanvas';
import { TopBar } from './components/TopBar';

const App: React.FC = () => {
  React.useEffect(() => {
    loadGameData().catch(console.error);
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-zinc-950 text-zinc-100 font-sans select-none">
      <TopBar />
      <div className="flex-1 flex overflow-hidden min-h-0">
        <FilterPanel />
        <TimelineCanvas />
        <EventDrawer />
      </div>
    </div>
  );
};

export default App;
