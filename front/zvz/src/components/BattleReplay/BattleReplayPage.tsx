import React from 'react';
import { TimelineView } from './TimelineView';
import { ReplayFilters } from './ReplayFilters';
import { PlayerStatusList } from './PlayerStatusList';
import { EventDetailPanel } from './EventDetailPanel';
import { ImportLogButton } from './ImportLogButton';

export const BattleReplayPage: React.FC = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-200">
      {/* Main Content - Timeline and Event Details */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar - Filters */}
        <div className="h-16 border-b border-zinc-800 bg-zinc-900 px-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-zinc-100">Battle Replay</h1>
          <div className="flex items-center gap-3">
            <ImportLogButton />
            <ReplayFilters />
          </div>
        </div>

        {/* Timeline Area */}
        <div className="flex-1 relative overflow-hidden bg-zinc-950 p-4">
          <TimelineView />
        </div>

        {/* Event Details Panel (Bottom or overlay) */}
        <div className="h-64 border-t border-zinc-800 bg-zinc-900 p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Event Details</h2>
          <EventDetailPanel />
        </div>
      </div>

      {/* Right Sidebar - Player List */}
      <div className="w-80 border-l border-zinc-800 bg-zinc-900 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="font-semibold text-zinc-100">Players</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <PlayerStatusList />
        </div>
      </div>
    </div>
  );
};
