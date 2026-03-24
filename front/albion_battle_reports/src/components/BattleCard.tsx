import React, { useState } from 'react';
import { Users, ExternalLink, ChevronDown, ChevronUp, UserMinus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PlayerBattleSummary, PlayerInfo } from '../types';
import { cn } from '../lib/utils';
import { formatWeaponName, calcKD, getItemIconUrl } from '../lib/formatters';
import { BattleDetails } from './BattleDetails';

interface BattleCardProps {
  record: PlayerBattleSummary;
  key?: React.Key;
}

export function BattleCard({ record }: BattleCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isWin = record.TeamKills > record.TeamDeaths;
  const mainHandType = record.Player.Equipment.MainHand?.Type;
  const weaponName = formatWeaponName(mainHandType);
  const weaponIcon = getItemIconUrl(mainHandType, 64);
  
  // Calculate average team IP including the player
  const allMembers = [...record.TeamMembers, record.Player];
  const avgTeamIP = allMembers.reduce((sum, m) => sum + m.AverageItemPower, 0) / (allMembers.length || 1);

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return t('battle.daysAgo', { count: diffDays });
    if (diffHours > 0) return t('battle.hoursAgo', { count: diffHours });
    return t('battle.minsAgo', { count: diffMins });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors rounded-xl overflow-hidden flex flex-col">
      {/* Main Row */}
      <div 
        className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status indicator */}
        <div className={cn(
          "w-2 h-16 rounded-full shrink-0 hidden sm:block",
          isWin ? "bg-emerald-500" : "bg-rose-500"
        )} />
        
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 mb-2">
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
              isWin ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            )}>
              {isWin ? t('battle.victory') : t('battle.defeat')}
            </span>
            <span className="text-sm text-slate-500">{timeAgo(record.StartTime)}</span>
            <a 
              href={`https://albiononline.com/killboard/battles/${record.BattleID}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-indigo-400 hover:text-indigo-300 ml-auto flex items-center gap-1 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {t('battle.id')}: {record.BattleID} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            {weaponIcon && (
              <img 
                src={weaponIcon} 
                alt={weaponName} 
                className="w-10 h-10 object-contain bg-slate-800/50 rounded p-1 border border-slate-700"
                loading="lazy"
              />
            )}
            <div className="min-w-0">
              <div className="text-xs text-slate-500 mb-1">{t('battle.weapon')}</div>
              <div className="text-sm font-medium text-slate-200 truncate" title={weaponName}>
                {weaponName}
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-xs text-slate-500 mb-1">{t('battle.personalKD')}</div>
            <div className="text-sm font-medium text-slate-200">
              <span className="text-emerald-400">{record.Kills}</span>
              <span className="text-slate-600 mx-1">/</span>
              <span className="text-rose-400">{record.Deaths}</span>
              <span className="text-slate-500 ml-2 text-xs">({calcKD(record.Kills, record.Deaths)})</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 mb-1">{t('battle.teamKD')}</div>
            <div className="text-sm font-medium text-slate-200">
              <span className="text-emerald-400">{record.TeamKills}</span>
              <span className="text-slate-600 mx-1">/</span>
              <span className="text-rose-400">{record.TeamDeaths}</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 mb-1">{t('battle.avgTeamIP')}</div>
            <div className="text-sm font-medium text-amber-400">
              {Math.round(avgTeamIP)}
            </div>
          </div>
        </div>
      </div>

      {/* Teammates and Enemies */}
      <div className="w-full lg:w-[480px] shrink-0 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4 flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Team Members */}
        <div className="flex-1">
          <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <Users className="w-3 h-3 text-indigo-400" /> {t('battle.teammates')}
          </div>
          <PlayerList players={record.TeamMembers} t={t} isEnemy={false} />
        </div>
        
        {/* Enemy Members */}
        {record.EnemyMembers && record.EnemyMembers.length > 0 && (
          <div className="flex-1 border-t sm:border-t-0 sm:border-l border-slate-800/50 pt-3 sm:pt-0 sm:pl-6">
            <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <UserMinus className="w-3 h-3 text-rose-400" /> {t('battle.enemies')}
            </div>
            <PlayerList players={record.EnemyMembers} t={t} isEnemy={true} />
          </div>
        )}
      </div>
      
      <div className="pl-2 pt-1 sm:pt-0 shrink-0 self-center sm:self-auto">
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
      </div>
      </div>
      
      {/* Expanded Equipment Details */}
      {expanded && (
        <BattleDetails record={record} />
      )}
    </div>
  );
}

function PlayerList({ players, t, isEnemy }: { players: PlayerInfo[], t: any, isEnemy: boolean }) {
  if (!players || players.length === 0) {
    return <div className="text-xs text-slate-600 italic">{t('battle.solo')}</div>;
  }

  const badgeColor = isEnemy 
    ? "bg-slate-900/50 text-rose-300 hover:bg-slate-800/80 border border-slate-800" 
    : "bg-slate-800 text-slate-300 hover:bg-slate-700";

  return (
    <div className="flex flex-wrap gap-1">
      {players.slice(0, 7).map((member, i) => (
        <div 
          key={i} 
          className={cn("px-2 py-1 rounded text-xs truncate max-w-[100px] cursor-help transition-colors", badgeColor)}
          title={member.Name}
        >
          {member.Name}
        </div>
      ))}
      {players.length > 7 && (
        <div 
          className={cn("px-2 py-1 rounded text-xs cursor-help transition-colors relative group", badgeColor)}
          title={players.slice(7).map(m => m.Name).join(', ')}
        >
          +{players.length - 7}
        </div>
      )}
    </div>
  );
}
