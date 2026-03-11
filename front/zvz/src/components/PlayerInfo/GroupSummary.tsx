import React, { useMemo } from 'react';
import { Player, ItemData } from '../../types';
import { getItem, getLocalizedText } from '../../utils/dataManager';
import { useTranslation } from 'react-i18next';

interface GroupSummaryProps {
  players: Player[];
}

interface ItemStat {
  count: number;
  pLevels: Record<string, number>;
  sampleItem: ItemData;
}

export const GroupSummary: React.FC<GroupSummaryProps> = ({ players }) => {
  const { t } = useTranslation();

  const { weaponStats, armorStats } = useMemo(() => {
    const wStats: Record<string, ItemStat> = {};
    const aStats: Record<string, ItemStat> = {};

    players.forEach(p => {
      const equip = p.Equipments || [];
      const weaponId = equip[0];
      const armorId = equip[3]; // Chest

      const processItem = (id: number, stats: Record<string, ItemStat>) => {
        if (!id) return;
        const item = getItem(id);
        if (!item) return;

        // Use NameID for grouping (ignores Tier/Enchant), fallback to UniqueName base if needed
        const key = item.NameID || item.UniqueName.replace(/T\d+_/, '').replace(/@\d+/, '');
        
        if (!stats[key]) {
          stats[key] = {
            count: 0,
            pLevels: {},
            sampleItem: item
          };
        }
        
        stats[key].count++;
        
        const pLevel = `${item.Tier}.${item.Enchant}`;
        stats[key].pLevels[pLevel] = (stats[key].pLevels[pLevel] || 0) + 1;
        
        // Use highest tier as sample for better icon resolution/visual
        if (item.Tier > stats[key].sampleItem.Tier) {
            stats[key].sampleItem = item;
        }
      };

      processItem(weaponId, wStats);
      processItem(armorId, aStats);
    });

    return { 
        weaponStats: Object.values(wStats).sort((a, b) => b.count - a.count), 
        armorStats: Object.values(aStats).sort((a, b) => b.count - a.count) 
    };
  }, [players]);

  const renderItemStats = (stats: ItemStat[]) => {
    return (
      <div className="flex flex-wrap gap-2">
        {stats.map((stat) => {
           const item = stat.sampleItem;
           const name = getLocalizedText(item.Name);
           // Construct tooltip
           const pLevelBreakdown = Object.entries(stat.pLevels)
             .map(([lvl, count]) => {
                const [tier, enchant] = lvl.split('.').map(Number);
                return { tier, enchant, count };
             })
             .sort((a, b) => {
                if (a.tier !== b.tier) return b.tier - a.tier;
                return b.enchant - a.enchant;
             })
             .map(({tier, enchant, count}) => `P${tier + enchant} x${count}`)
             .join('\n');
           
           const tooltip = `${name}\n\n${pLevelBreakdown}`;

           return (
             <div key={item.NameID || item.UniqueName} className="flex items-center bg-zinc-800 rounded px-1.5 py-1 border border-zinc-700/50 hover:border-zinc-500 transition-colors cursor-help" title={tooltip}>
               <img 
                 src={`https://render.albiononline.com/v1/item/${item.UniqueName}`} 
                 className="w-8 h-8 mr-1.5 object-contain" 
                 alt={name} 
               />
               <span className="text-zinc-200 font-bold text-sm mr-1 w-5 text-center inline-block">{stat.count}</span>
             </div>
           );
        })}
      </div>
    );
  };

  if (players.length === 0) return null;

  return (
    <div className="bg-zinc-900/30 p-2 rounded-lg border border-zinc-800/50 mb-3 space-y-2">
       {weaponStats.length > 0 && (
         <div className="flex flex-col gap-1">
            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider px-1">{t("Weapon")}</span>
            <div className="flex-1">
                {renderItemStats(weaponStats)}
            </div>
         </div>
       )}
       {weaponStats.length > 0 && armorStats.length > 0 && (
         <div className="h-px bg-zinc-800/50 my-1"></div>
       )}
       {armorStats.length > 0 && (
         <div className="flex flex-col gap-1">
            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider px-1">{t("Armor")}</span>
            <div className="flex-1">
                {renderItemStats(armorStats)}
            </div>
         </div>
       )}
    </div>
  );
};
