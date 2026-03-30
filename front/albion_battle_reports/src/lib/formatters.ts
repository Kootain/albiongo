import { getLocalizedText, getTranslatedItemName } from './dataManager';

export const formatWeaponName = (weaponType: string | undefined): string => {
  if (!weaponType) return 'Unknown';
  
  const localized = getTranslatedItemName(weaponType);
  if (localized !== weaponType && localized !== 'Unknown') {
    return localized;
  }
  
  // Fallback to formatting the raw type string
  return weaponType
    .replace(/^T\d+_MAIN_/, '')
    .replace(/^T\d+_2H_/, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
};

const image_proxy = 'https://pic.kootain.workers.dev/?url='

export const getItemIconUrl = (itemType: string | undefined, size: number = 64): string => {
  if (!itemType) return '';
  // The official albion online render API endpoint for item icons
  return `${image_proxy}https://render.albiononline.com/v1/item/${itemType}.png?size=${size}`;
};

// Helper to calculate KD
export const calcKD = (kills: number, deaths: number) => {
  if (deaths === 0) return kills.toFixed(2);
  return (kills / deaths).toFixed(2);
};
