import { BaseEvent } from "./BaseEvent";

export interface NewCharacterEvent extends BaseEvent {
  Code: 29;
  Name: string;
  GuildName?: string;
  AllianceName?: string;
  EquipmentIDs?: number[];
  SpellIDs?: number[];
}
