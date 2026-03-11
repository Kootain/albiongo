import { BaseEvent } from "./BaseEvent";

export interface CastSpellEvent extends BaseEvent {
  Code: 19;
  CasterName: string;
  SpellIndex: number;
}
