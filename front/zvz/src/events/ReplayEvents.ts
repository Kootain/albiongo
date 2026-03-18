import { BaseEvent } from './BaseEvent';

export interface SpellHitEvent extends BaseEvent {
  ObjectID1: number; // AttackerID
  ObjectID2: number; // TargetID
  SpellIndex: number;
  Unknown1?: number;
  Unknown2?: number;
}

export interface HealthUpdateEvent extends BaseEvent {
  ObjectID: number; // TargetID
  HealthChange: number; // Positive for heal, negative for damage? Need verification
  CurrentHealth: number;
  SourceID?: number;
}

export interface BuffEvent extends BaseEvent {
  ObjectID: number; // TargetID
  SpellIDs: number[];
  SourceIDs?: number[];
  Durations?: number[];
}

export interface DeathEvent extends BaseEvent {
  VictimID: number;
  KillerID?: number;
}
