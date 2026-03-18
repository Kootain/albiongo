import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Player } from "../../types";
import { getItem, getSpell, getLocalizedText, getWeaponType as getWType } from "../../utils/dataManager";
import { PlayerDetailsModal } from "./PlayerDetailsModal";
import { WeaponTypeIcon } from "./WeaponTypeIcon";

interface PlayerCardProps {
  player: Player;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const getWeaponType = (weaponId: number) => {
    if (!weaponId) return "";
    const item = getItem(weaponId);
    if (!item) return "";
    const nameZH = item.Name && item.Name['ZH-CN'] ? item.Name['ZH-CN'] : '';
    return getWType(nameZH) || "";
  };

  const renderItem = (eqId: number, spellIds: number[], slotName: string) => {
    if (eqId <= 0) return (
      <div className="text-sm text-zinc-600 italic truncate">{t("No")} {t(slotName)}</div>
    );
    const item = getItem(eqId);
    if (!item) return (
      <div className="text-sm text-zinc-600 italic truncate">{t("Unknown")}</div>
    );

    const itemName = getLocalizedText(item.Name);
    
    const spells = spellIds.filter(id => id > 0).map(id => {
      const spell = getSpell(id);
      return spell ? getLocalizedText(spell.Name) : `Spell ${id}`;
    });
    
    const tooltipText = spells.length > 0 ? spells.join(' / ') : t('No Spells');

    return (
      <div className="group relative flex items-center" title={tooltipText}>
        <img src={`https://render.albiononline.com/v1/item/${item.UniqueName}`} className="w-8 h-8 mr-2 object-contain" alt={itemName} />
        <div className="text-sm text-zinc-300 truncate">
          <span className="text-indigo-400/80 mr-1"> P{item.Tier+item.Enchant}</span>
          {itemName}
        </div>
      </div>
    );
  };

  const weaponId = (player.Equipments || [])[0];
  const weaponType = getWeaponType(weaponId);

  return (
    <>
      <div 
        className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg cursor-pointer transition-colors border border-zinc-700/50 hover:border-indigo-500/50 flex flex-col gap-1.5"
        onClick={() => setShowModal(true)}
      >
        <div 
          className="flex items-center gap-1.5 px-1 overflow-hidden"
          title={[player.Name, player.AllianceName ? `[${player.AllianceName}]` : '', player.GuildName, player.UpdateTime ? ` (${new Date(player.UpdateTime).toLocaleString()})` : ''].filter(Boolean).join(' ')}
        >
          <div className="shrink-0 flex items-center justify-center w-4 h-4">
             {weaponType && <WeaponTypeIcon type={weaponType} />}
          </div>
          <span className="font-semibold text-zinc-100 shrink-0 truncate">{player.Name}</span>
          {(player.AllianceName || player.GuildName) && (
            <span className="text-xs text-zinc-400 truncate">
              {player.AllianceName && `[${player.AllianceName}] `}
              {player.GuildName}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 bg-zinc-900/50 p-1.5 rounded-md border border-zinc-700/30">
          {renderItem((player.Equipments || [])[0], [(player.Spells || [])[0], (player.Spells || [])[1], (player.Spells || [])[2]], "Weapon")}
          {renderItem((player.Equipments || [])[2], [(player.Spells || [])[4]], "Head")}
          {renderItem((player.Equipments || [])[3], [(player.Spells || [])[3]], "Chest")}
          {renderItem((player.Equipments || [])[4], [(player.Spells || [])[5]], "Shoes")}
        </div>
      </div>

      {showModal && (
        <PlayerDetailsModal player={player} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};
