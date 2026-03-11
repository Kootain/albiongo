export interface Player {
  Name: string;
  GuildName: string;
  AllianceName: string;
  Equipments: number[];
  Spells: number[];
}

export interface PlayerEquipment {
  MainHand: ItemData | null;
  OffHand: ItemData | null;
  Head: ItemData | null;
  Chest: ItemData | null;
  Shoes: ItemData | null;
  Bag: ItemData | null;
  Cape: ItemData | null;
  Mount: ItemData | null;
  Potion: ItemData | null;
  Food: ItemData | null;
}

export interface ColorBlockConfig {
  id: string;
  color: string;
  assignments: { playerName: string; spellId: number }[];
}

export interface LocalizedText {
  "EN-US"?: string;
  "ZH-CN"?: string;
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
