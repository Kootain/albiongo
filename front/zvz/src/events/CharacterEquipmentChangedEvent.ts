import { BaseEvent } from "./BaseEvent";

export interface CharacterEquipmentChangedEvent extends BaseEvent {
  Code: 90;
  Name: string;
  GuildName?: string;
  AllianceName?: string;
  EquipmentIDs?: number[];
  SpellIDs?: number[];
}
