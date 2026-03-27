import { create } from 'zustand';
import type { BattleEvent, EventType, RawLogEntry } from '../types';
import { useBattleStore } from './useBattleStore';

export type LiveStatus = 'connected' | 'reconnecting' | 'disconnected';

export type WsEvent = RawLogEntry;

// ── Code → EventType 映射 ────────────────────────────────────────────────────
const CODE_TO_TYPE: Record<number, EventType> = {
  1:   'leave',
  6:   'health_update',
  7:   'health_updates',
  8:   'energy_update',
  13:  'attack',
  14:  'cast_start',
  18:  'cast_finished',
  19:  'cast_spell',
  21:  'cast_hit',
  22:  'cast_hits',
  29:  'new_character',
  90:  'equipment_change',
  113: 'spell_effect_area',
  141: 'forced_movement',
  165: 'kill',
  209: 'mounted',
  210: 'mount_start',
};

let seq = 0;

/**
 * 将 WS 事件解析为 BattleEvent。
 * 原则：名字/公会等信息直接从事件字段取，后端已补全，不做 objectID→name 映射。
 * SpellIndex / SpellID 均为直接 DB ID，直接传给 SDK 查询。
 */
function parseWsEvent(raw: WsEvent): BattleEvent {
  const type: EventType = raw.Type === 0 ? (CODE_TO_TYPE[raw.Code] ?? 'unknown') : 'unknown';
  const id = `live-${raw.Ts}-${raw.Code}-${seq++}`;
  const base: BattleEvent = { id, ts: raw.Ts, type, raw };

  switch (type) {
    case 'new_character':
    case 'equipment_change':
      return {
        ...base,
        actorId:       raw.ObjectID,
        actorName:     raw.Name,
        actorGuild:    raw.GuildName,
        actorAlliance: raw.AllianceName,
        equipmentIds:  raw.EquipmentIDs,
      };

    case 'leave':
      return {
        ...base,
        actorId:   raw.ObjectID,
        actorName: raw.Name,
        actorGuild:raw.GuildName,
      };

    case 'cast_spell':
      return {
        ...base,
        actorId:    raw.CasterObjectID,
        actorName:  raw.CasterName,
        targetId:   raw.TargetObjectID,
        targetName: raw.TargetName,
        spellId:    raw.SpellIndex,   // 直接 DB ID
      };

    case 'cast_hit':
      return {
        ...base,
        actorId:    raw.CasterObjectID,
        actorName:  raw.CasterName,
        targetId:   raw.HitObjectID,
        targetName: raw.HitName,
        spellId:    raw.SpellIndex,   // 直接 DB ID
      };

    case 'cast_hits':
      return {
        ...base,
        actorId:   raw.CasterObjectID,
        actorName: raw.CasterName,
        spellId:   raw.SpellIndices?.[0],  // 直接 DB ID
      };

    case 'cast_start':
      return {
        ...base,
        actorId:   raw.ObjectID,
        actorName: raw.Name,
        spellId:   raw.SpellIndex,    // 直接 DB ID
      };

    case 'cast_finished':
      return {
        ...base,
        actorId:   raw.CasterObjectID,
        actorName: raw.CasterName,
        spellId:   raw.SpellID,       // 直接 DB ID
      };

    case 'attack':
      return {
        ...base,
        actorId:    raw.AttackerObjectID,
        actorName:  raw.AttackerName,
        targetId:   raw.TargetObjectID,
        targetName: raw.TargetName,
      };

    case 'kill':
      return {
        ...base,
        actorId:     raw.KillerID,
        actorName:   raw.KillerName,
        actorGuild:  raw.KillerGuild,
        targetId:    raw.VictimID,
        targetName:  raw.VictimName,
        targetGuild: raw.VictimGuild,
      };

    case 'health_update':
      return {
        ...base,
        actorId:       raw.ObjectID,
        actorName:     raw.Name,
        actorGuild:    raw.GuildName,
        targetId:      raw.CauserID,
        targetName:    raw.CauserName,
        spellId:       raw.SpellID,   // 直接 DB ID
        damage:        raw.HealthDelta,
        currentHealth: raw.Health,
      };

    case 'forced_movement':
      return {
        ...base,
        actorId:    raw.SourceObjectID,
        actorName:  raw.SourceName,
        targetId:   raw.TargetObjectID,
        targetName: raw.TargetName,
        spellId:    raw.SpellID,      // 直接 DB ID
      };

    case 'spell_effect_area':
      return {
        ...base,
        actorId:   raw.CasterObjectID,
        actorName: raw.CasterName,
        spellId:   raw.SpellID,       // 直接 DB ID
      };

    case 'mounted':
    case 'mount_start':
      return {
        ...base,
        actorId:     raw.ObjectID,
        actorName:   raw.Name,
        mountItemId: raw.MountItemID,
      };

    default:
      return base;
  }
}

// ── Store ────────────────────────────────────────────────────────────────────
interface LiveState {
  status:    LiveStatus;
  killCount: number;

  setStatus:  (s: LiveStatus) => void;
  processRaw: (raw: WsEvent) => void;
  resetLive:  () => void;
}

export const useLiveStore = create<LiveState>((set, get) => ({
  status:    'disconnected',
  killCount: 0,

  setStatus: (status) => set({ status }),

  processRaw: (raw) => {
    const event  = parseWsEvent(raw);
    const isKill = event.type === 'kill';

    useBattleStore.getState().appendLiveEvent(event);

    if (isKill) set({ killCount: get().killCount + 1 });
  },

  resetLive: () => set({ killCount: 0 }),
}));
