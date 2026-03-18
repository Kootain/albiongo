import React from 'react';
import { useReplayStore } from '../../store/useReplayStore';
import { Player } from '../../types';
import { Shield, Swords, Zap, Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const PlayerStatusList: React.FC = () => {
  const { players, filters } = useReplayStore();
  
  // Apply filters
  const filteredPlayers = Object.values(players).filter(player => {
    if (filters.guilds.length > 0 && !filters.guilds.includes(player.GuildName)) return false;
    // Add more filters as needed
    return true;
  });

  return (
    <div className="flex flex-col gap-2">
      {filteredPlayers.length === 0 ? (
        <div className="text-zinc-500 text-sm text-center py-4">No players found</div>
      ) : (
        filteredPlayers.map(player => (
          <PlayerCard key={player.Name} player={player} />
        ))
      )}
    </div>
  );
};

const PlayerCard: React.FC<{ player: Player }> = ({ player }) => {
  // Mock status data
  const health = 80; // %
  const mana = 40; // %
  
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2 hover:bg-zinc-800 transition-colors cursor-pointer group">
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm font-semibold text-zinc-200 truncate">{player.Name}</span>
        <span className="text-xs text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">{player.GuildName || 'No Guild'}</span>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
        <span className="flex items-center gap-1"><Shield size={10} /> {player.AllianceName || '-'}</span>
        {/* Weapon icon placeholder */}
        <span className="flex items-center gap-1"><Swords size={10} /> Weapon</span>
      </div>

      {/* Health Bar */}
      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden mb-1">
        <div 
          className="h-full bg-red-500/80 rounded-full transition-all duration-300" 
          style={{ width: `${health}%` }}
        />
      </div>
      
      {/* Mana Bar */}
      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500/80 rounded-full transition-all duration-300" 
          style={{ width: `${mana}%` }}
        />
      </div>

      {/* Buffs (Mock) */}
      <div className="flex gap-1 mt-2">
         <div className="w-4 h-4 bg-zinc-700 rounded-sm border border-zinc-600" title="Buff 1" />
         <div className="w-4 h-4 bg-zinc-700 rounded-sm border border-zinc-600" title="Buff 2" />
      </div>
    </div>
  );
};
