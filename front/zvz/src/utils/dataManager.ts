import { ItemData, SpellData, LocalizedText } from "../types";
import i18n from "../i18n";

const itemMap = new Map<number, ItemData>();
const spellMap = new Map<number, SpellData>();

export const loadGameData = async () => {
  try {
    const baseUrl = 'http://localhost:8081';
    
    const [itemsResponse, spellsResponse] = await Promise.all([
      fetch(`${baseUrl}/data/items.json`),
      fetch(`${baseUrl}/data/spells.json`)
    ]);

    if (!itemsResponse.ok || !spellsResponse.ok) {
        throw new Error('Failed to fetch data');
    }

    const itemsData = await itemsResponse.json();
    const spellsData = await spellsResponse.json();

    Object.values(itemsData).forEach((item: any) => {
      itemMap.set(item.Index, item);
    });

    Object.values(spellsData).forEach((spell: any) => {
      spellMap.set(spell.Index, spell);
    });
    
    console.log(`Loaded ${itemMap.size} items and ${spellMap.size} spells`);
  } catch (error) {
    console.error('Failed to load game data:', error);
    throw error;
  }
};

export const getItem = (id: number): ItemData | undefined => {
  return itemMap.get(id);
};

export const getSpell = (id: number): SpellData | undefined => {
  return spellMap.get(id);
};

export const getLocalizedText = (localizedText: LocalizedText | undefined): string => {
  if (!localizedText) return '';
  const lang = i18n.language === 'zh' ? 'ZH-CN' : 'EN-US';
  return localizedText[lang] || localizedText['EN-US'] || Object.values(localizedText)[0] || '';
};
