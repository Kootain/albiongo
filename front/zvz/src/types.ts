export interface Player {
  Name: string;
  GuildName: string;
  AllianceName: string;
  Equipments: number[];
  Spells: number[];
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
