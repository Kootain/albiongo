import React from 'react';
import { useReplayStore } from '../../store/useReplayStore';
import { Play, Pause, FastForward, Rewind } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const ReplayFilters: React.FC = () => {
  const { 
    filters, 
    setFilters, 
    isPlaying, 
    setIsPlaying, 
    speed, 
    setSpeed 
  } = useReplayStore();

  const handleGuildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Logic to update guild filter
    const val = e.target.value;
    setFilters({ guilds: val ? [val] : [] });
  };

  return (
    <div className="flex items-center gap-4">
      {/* Playback Controls */}
      <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1 border border-zinc-700">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={twMerge(
            "p-1.5 rounded-md transition-colors",
            isPlaying ? "text-indigo-400 bg-indigo-500/10" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
          )}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        
        <div className="h-4 w-px bg-zinc-700 mx-1" />
        
        <button 
          onClick={() => setSpeed(Math.max(0.5, speed - 0.5))}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          title="Slower"
        >
          <Rewind size={16} />
        </button>
        <span className="text-xs font-mono w-8 text-center text-zinc-300">{speed}x</span>
        <button 
          onClick={() => setSpeed(Math.min(4, speed + 0.5))}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          title="Faster"
        >
          <FastForward size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <select 
          className="bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          onChange={handleGuildChange}
          // Populate with unique guilds from store
        >
          <option value="">All Guilds</option>
          {/* Mock options */}
          <option value="GuildA">Guild A</option>
          <option value="GuildB">Guild B</option>
        </select>
        
        <select 
          className="bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          onChange={(e) => setFilters({ weapons: e.target.value ? [e.target.value] : [] })}
        >
          <option value="">All Weapons</option>
          <option value="Sword">Sword</option>
          <option value="Bow">Bow</option>
        </select>
      </div>
    </div>
  );
};
