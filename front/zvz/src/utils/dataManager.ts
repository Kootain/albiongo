/**
 * 转发层：统一从 @albion/game-data 共享包导出，保持原有调用接口不变。
 * zvz 特有：通过 i18n 同步语言设置。
 */
import i18n from '../i18n';
import {
  getLocalizedText as _getLocalizedText,
  setLanguage,
} from '@albion/game-data';

export {
  loadGameData,
  isLoaded,
  getItem,
  getSpell,
  getWeaponType,
  getAllItems,
  getAllSpells,
  getItemName,
  getSpellName,
} from '@albion/game-data';

export type { ItemData, SpellData, LocalizedText } from '@albion/game-data';

// 跟随 i18n 语言变化同步共享包的语言设置
const syncLang = () => setLanguage(i18n.language === 'zh' ? 'ZH-CN' : 'EN-US');
syncLang();
i18n.on('languageChanged', syncLang);

/** 使用 i18n 当前语言做本地化，与共享包语言保持同步 */
export const getLocalizedText = _getLocalizedText;
