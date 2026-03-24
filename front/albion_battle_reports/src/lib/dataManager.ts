import { ItemData, LocalizedText } from "../types";
import i18n from '../i18n';

const itemMap = new Map<string, ItemData>();

export const loadGameData = async () => {
  if (itemMap.size > 0) return; // Already loaded

  try {
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    const response = await fetch(`${protocol}://albion-resource.oss-cn-shanghai.aliyuncs.com/items.json`);
    if (!response.ok) {
      throw new Error(`Failed to load items data: ${response.status}`);
    }

    const itemsData = await response.json();

    Object.values(itemsData).forEach((item: any) => {
      // Store by UniqueName so we can lookup by Type (e.g. T8_MAIN_SWORD)
      if (item.UniqueName) {
        itemMap.set(item.UniqueName, item);
      }
    });

    console.log(`Loaded ${itemMap.size} items`);
  } catch (error) {
    console.error('Failed to load game data:', error);
    // don't throw, just allow the app to work without translation if data server is down
  }
};

export const getItem = (uniqueName: string): ItemData | undefined => {
  return itemMap.get(uniqueName);
};

export const getLocalizedText = (localizedText: LocalizedText | undefined): string => {
  if (!localizedText) return '';
  const lang = i18n.language === 'zh' ? 'ZH-CN' : 'EN-US';
  return localizedText[lang] || localizedText['ZH-CN'] || localizedText['EN-US'] || Object.values(localizedText)[0] || '';
};

export const getTranslatedItemName = (uniqueName: string | undefined): string => {
  if (!uniqueName) return 'Unknown';
  const item = getItem(uniqueName);
  if (item && item.Name) {
    const translated = getLocalizedText(item.Name);
    if (translated) return translated;
  }
  return uniqueName;
};
