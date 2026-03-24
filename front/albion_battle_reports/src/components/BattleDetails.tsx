import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlayerBattleSummary } from '../types';
import { cn } from '../lib/utils';
import { formatWeaponName, getItemIconUrl } from '../lib/formatters';

interface BattleDetailsProps {
  record: PlayerBattleSummary;
}

export function BattleDetails({ record }: BattleDetailsProps) {
  const { t } = useTranslation();

  return (
    <div className="p-4 bg-slate-950/50 border-t border-slate-800 animate-in slide-in-from-top-2 duration-200">
      <div className="text-sm font-medium text-slate-300 mb-3">{t('battle.equipmentDetails')}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {record.TeamMembers.map((member, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className={cn("font-medium", member.Name === record.Player.Name ? "text-indigo-400" : "text-slate-300")}>
                {member.Name}
              </span>
              <span className="text-xs text-amber-400 font-medium">IP: {Math.round(member.AverageItemPower)}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <EquipRow label={t('battle.mainHand')} type={member.Equipment.MainHand?.Type} />
              <EquipRow label={t('battle.offHand')} type={member.Equipment.OffHand?.Type} />
              <EquipRow label={t('battle.head')} type={member.Equipment.Head?.Type} />
              <EquipRow label={t('battle.armor')} type={member.Equipment.Armor?.Type} />
              <EquipRow label={t('battle.shoes')} type={member.Equipment.Shoes?.Type} />
              <EquipRow label={t('battle.cape')} type={member.Equipment.Cape?.Type} />
            </div>
          </div>
        ))}
      </div>
      
      {record.EnemyMembers && record.EnemyMembers.length > 0 && (
        <>
          <div className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            {t('battle.enemyEquipmentDetails')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {record.EnemyMembers.map((member, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800/80 rounded p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <span className="font-medium text-rose-300">
                    {member.Name}
                  </span>
                  <span className="text-xs text-amber-400 font-medium">IP: {Math.round(member.AverageItemPower)}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs opacity-80 hover:opacity-100 transition-opacity">
                  <EquipRow label={t('battle.mainHand')} type={member.Equipment.MainHand?.Type} />
                  <EquipRow label={t('battle.offHand')} type={member.Equipment.OffHand?.Type} />
                  <EquipRow label={t('battle.head')} type={member.Equipment.Head?.Type} />
                  <EquipRow label={t('battle.armor')} type={member.Equipment.Armor?.Type} />
                  <EquipRow label={t('battle.shoes')} type={member.Equipment.Shoes?.Type} />
                  <EquipRow label={t('battle.cape')} type={member.Equipment.Cape?.Type} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EquipRow({ label, type }: { label: string, type?: string }) {
  if (!type) return (
    <div className="flex justify-between items-center text-slate-600 h-8">
      <span>{label}</span>
      <span>-</span>
    </div>
  );
  
  const name = formatWeaponName(type);
  const iconUrl = getItemIconUrl(type, 32);
  
  return (
    <div className="flex justify-between items-center h-8">
      <span className="text-slate-500">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-slate-300 truncate text-right" title={name}>{name}</span>
        <img 
          src={iconUrl} 
          alt={name} 
          className="w-6 h-6 object-contain bg-slate-800 rounded p-0.5 border border-slate-700 shrink-0" 
          loading="lazy"
        />
      </div>
    </div>
  );
}
