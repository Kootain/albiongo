export interface LocalizedText {
  'EN-US'?: string;
  'ZH-CN'?: string;
  [key: string]: string | undefined;
}

export interface ItemData {
  Index: number;
  UniqueName: string;
  Name: LocalizedText;
  Description: LocalizedText;
  Tier: number;
  Enchant: number;
  NameID: string;
}

export interface SpellData {
  Index: number;
  UniqueName: string;
  Name: LocalizedText;
  Description: LocalizedText;
}

export interface WeaponTypeEntry {
  name: string;
  type: string;
}
