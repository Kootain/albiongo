import React from 'react';
import { useReplayStore } from '../../store/useReplayStore';
import { X, Clock, User, Sword, Shield, Zap } from 'lucide-react';
import moment from 'moment';

export const EventDetailPanel: React.FC = () => {
  const { selectedEvent, selectEvent } = useReplayStore();

  if (!selectedEvent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <span className="text-sm">Select an event on the timeline to view details</span>
      </div>
    );
  }

  return (
    <div className="relative bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 h-full overflow-y-auto">
      <button 
        onClick={() => selectEvent(null)}
        className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded-md transition-colors"
      >
        <X size={16} />
      </button>

      <div className="mb-4">
        <h3 className="text-lg font-bold text-zinc-100 mb-1 capitalize flex items-center gap-2">
          {getEventIcon(selectedEvent.type)}
          {selectedEvent.type} Event
        </h3>
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <Clock size={14} />
          <span className="font-mono">{moment(selectedEvent.timestamp).format('HH:mm:ss.SSS')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-zinc-900/50 p-3 rounded-md border border-zinc-800/50">
          <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">Source</span>
          <div className="flex items-center gap-2 font-semibold text-zinc-200">
            <User size={16} className="text-indigo-400" />
            {selectedEvent.sourceName || 'Unknown'}
          </div>
        </div>
        
        <div className="bg-zinc-900/50 p-3 rounded-md border border-zinc-800/50">
          <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">Target</span>
          <div className="flex items-center gap-2 font-semibold text-zinc-200">
             <User size={16} className="text-red-400" />
             {selectedEvent.targetName || 'None'}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 p-3 rounded-md border border-zinc-800/50">
        <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Details</span>
        <pre className="text-xs font-mono text-zinc-300 bg-black/20 p-2 rounded overflow-x-auto">
          {JSON.stringify(selectedEvent.details, null, 2)}
        </pre>
      </div>
    </div>
  );
};

const getEventIcon = (type: string) => {
  switch (type) {
    case 'cast': return <Zap className="text-blue-400" size={20} />;
    case 'hit': return <Sword className="text-yellow-400" size={20} />;
    case 'damage': return <Sword className="text-red-400" size={20} />;
    case 'heal': return <Shield className="text-green-400" size={20} />;
    case 'death': return <X className="text-zinc-400" size={20} />;
    default: return <Zap className="text-zinc-400" size={20} />;
  }
};
