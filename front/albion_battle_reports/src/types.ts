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

export interface ItemSlot {
  Type: string;
  Count: number;
  Quality: number;
}

export interface Equipment {
  MainHand?: ItemSlot;
  OffHand?: ItemSlot;
  Head?: ItemSlot;
  Armor?: ItemSlot;
  Shoes?: ItemSlot;
  Bag?: ItemSlot;
  Cape?: ItemSlot;
  Mount?: ItemSlot;
  Potion?: ItemSlot;
  Food?: ItemSlot;
}

export interface PlayerInfo {
  ID: string;
  Name: string;
  AverageItemPower: number;
  Equipment: Equipment;
  Inventory: any;
  GuildName: string;
  GuildID: string;
  AllianceName: string;
  AllianceID: string;
  AllianceTag: string;
  Avatar: string;
  AvatarRing: string;
  DeathFame: number;
  KillFame: number;
  FameRatio: number;
  LifetimeStatistics: any;
}

export interface PlayerBattleSummary {
  Kills: number;
  Deaths: number;
  TeamKills: number;
  TeamDeaths: number;
  TeamMembers: PlayerInfo[];
  EnemyMembers: PlayerInfo[];
  Player: PlayerInfo;
  StartTime: string;
  BattleID: number;
}

export interface AvalonBattlePerformance {
  PlayerName: string;
  BattleCnt: number;
  WinCnt: number;
  LoseCnt: number;
  TeamKills: number;
  TeamDeaths: number;
  Kills: number;
  Deaths: number;
  BattleRecords: PlayerBattleSummary[];
}
