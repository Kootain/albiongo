import type {
  BattleEvent,
  BattleSession,
  EventType,
  PlayerProfile,
  RawLogEntry,
  WorkerMessage,
} from '../types';

// ─── 协议 Code 常量 ──────────────────────────────────────────────────────────────
const CODE_LEAVE            = 1;
const CODE_HEALTH_UPDATE    = 6;
const CODE_HEALTH_UPDATES   = 7;
const CODE_ENERGY_UPDATE    = 8;
const CODE_ATTACK           = 13;
const CODE_CAST_START       = 14;
const CODE_CAST_FINISHED    = 18;
const CODE_CAST_SPELL       = 19;
const CODE_CAST_HIT         = 21;
const CODE_CAST_HITS        = 22;
const CODE_NEW_CHARACTER    = 29;
const CODE_EQUIPMENT_CHANGED= 90;
const CODE_SPELL_EFFECT_AREA= 113;
const CODE_FORCED_MOVEMENT  = 141;
const CODE_DIED             = 165;
const CODE_MOUNTED          = 209;
const CODE_MOUNT_START      = 210;

// ─── Data 字段提取辅助（兼容数字键格式） ──────────────────────────────────────────
function dNum(entry: RawLogEntry, key: number): number | undefined {
  const v = entry.Data?.[String(key)];
  return typeof v === 'number' ? v : undefined;
}
function dStr(entry: RawLogEntry, key: number): string | undefined {
  const v = entry.Data?.[String(key)];
  return typeof v === 'string' ? v : undefined;
}
function dNumArr(entry: RawLogEntry, key: number): number[] | undefined {
  const v = entry.Data?.[String(key)];
  return Array.isArray(v) ? (v as number[]) : undefined;
}

function classifyEvent(entry: RawLogEntry): EventType {
  if (entry.Type !== 0) return 'unknown';
  switch (entry.Code) {
    case CODE_NEW_CHARACTER:     return 'new_character';
    case CODE_LEAVE:             return 'leave';
    case CODE_CAST_SPELL:        return 'cast_spell';
    case CODE_CAST_HIT:          return 'cast_hit';
    case CODE_CAST_HITS:         return 'cast_hits';
    case CODE_CAST_START:        return 'cast_start';
    case CODE_CAST_FINISHED:     return 'cast_finished';
    case CODE_ATTACK:            return 'attack';
    case CODE_HEALTH_UPDATE:     return 'health_update';
    case CODE_HEALTH_UPDATES:    return 'health_updates';
    case CODE_ENERGY_UPDATE:     return 'energy_update';
    case CODE_EQUIPMENT_CHANGED: return 'equipment_change';
    case CODE_DIED:              return 'kill';
    case CODE_FORCED_MOVEMENT:   return 'forced_movement';
    case CODE_SPELL_EFFECT_AREA: return 'spell_effect_area';
    case CODE_MOUNTED:           return 'mounted';
    case CODE_MOUNT_START:       return 'mount_start';
    default: return 'unknown';
  }
}

function buildEvent(entry: RawLogEntry, players: Record<number, PlayerProfile>): BattleEvent {
  const type = classifyEvent(entry);
  const id = `${entry.Ts}-${entry.Code}-${entry.ObjectID ?? entry.CasterObjectID ?? dNum(entry, 0) ?? 0}`;
  const base: BattleEvent = { id, ts: entry.Ts, type, raw: entry };

  const profile = (id: number | undefined) => id !== undefined ? players[id] : undefined;

  switch (type) {
    // ── 已有命名字段格式 ─────────────────────────────────────────────────────────
    case 'new_character':
    case 'equipment_change': {
      const p = profile(entry.ObjectID);
      return {
        ...base,
        actorId: entry.ObjectID,
        actorName: entry.Name ?? p?.name,
        actorGuild: entry.GuildName ?? p?.guildName,
        actorAlliance: entry.AllianceName ?? p?.allianceName,
        equipmentIds: entry.EquipmentIDs,
      };
    }
    case 'leave': {
      const p = profile(entry.ObjectID);
      return { ...base, actorId: entry.ObjectID, actorName: p?.name, actorGuild: p?.guildName };
    }
    case 'cast_spell': {
      const cp = profile(entry.CasterObjectID);
      const tp = profile(entry.TargetObjectID);
      return {
        ...base,
        actorId: entry.CasterObjectID,
        actorName: entry.CasterName ?? cp?.name,
        actorGuild: cp?.guildName,
        actorAlliance: cp?.allianceName,
        targetId: entry.TargetObjectID,
        targetName: entry.TargetName ?? tp?.name,
        spellId: entry.SpellIndex,
      };
    }
    case 'cast_start': {
      const p = profile(entry.ObjectID);
      return {
        ...base,
        actorId: entry.ObjectID,
        actorName: p?.name,
        actorGuild: p?.guildName,
        spellId: entry.SpellIndex,
      };
    }
    case 'cast_hit': {
      const p1 = profile(entry.ObjectID1);
      const p2 = profile(entry.ObjectID2);
      return {
        ...base,
        actorId: entry.ObjectID1,
        actorName: p1?.name,
        actorGuild: p1?.guildName,
        targetId: entry.ObjectID2,
        targetName: p2?.name,
        spellId: entry.SpellIndex,
      };
    }

    // ── Data 数字键格式（日志捕获时尚未实现的事件） ────────────────────────────────
    case 'kill': {
      // Data[1]=victimObjectID, [2]=victimName, [3]=victimGuild
      // Data[9]=killerObjectID, [10]=killerName, [11]=killerGuild
      const victimId  = dNum(entry, 1);
      const killerId  = dNum(entry, 9);
      const vp = profile(victimId);
      const kp = profile(killerId);
      return {
        ...base,
        actorId:    killerId,
        actorName:  dStr(entry, 10) ?? kp?.name,
        actorGuild: dStr(entry, 11) ?? kp?.guildName,
        targetId:   victimId,
        targetName: dStr(entry, 2)  ?? vp?.name,
        targetGuild:dStr(entry, 3)  ?? vp?.guildName,
      };
    }
    case 'attack': {
      // Data[0]=attacker, [2]=target, [6]=result(0=hit,1=miss)
      const attackerId = dNum(entry, 0);
      const targetId   = dNum(entry, 2);
      return {
        ...base,
        actorId:    attackerId,
        actorName:  profile(attackerId)?.name,
        actorGuild: profile(attackerId)?.guildName,
        targetId,
        targetName: profile(targetId)?.name,
      };
    }
    case 'cast_finished': {
      // Data[0]=casterObjectID, [2]=spellID
      const casterId = dNum(entry, 0);
      return {
        ...base,
        actorId:   casterId,
        actorName: profile(casterId)?.name,
        actorGuild:profile(casterId)?.guildName,
        spellId:   dNum(entry, 2),
      };
    }
    case 'cast_hits': {
      // Data[0]=casterObjectID, [1]=[targetObjectIDs], [2]=[spellIndices]
      const casterId   = dNum(entry, 0);
      const targetIds  = dNumArr(entry, 1);
      const firstTarget = targetIds?.[0];
      return {
        ...base,
        actorId:   casterId,
        actorName: profile(casterId)?.name,
        actorGuild:profile(casterId)?.guildName,
        targetId:  firstTarget,
        targetName:profile(firstTarget)?.name,
        spellId:   dNumArr(entry, 2)?.[0],
      };
    }
    case 'health_update': {
      // Data[0]=objectID, [2]=healthDelta, [3]=healthAfter, [6]=causerID, [7]=spellID
      const objectId = dNum(entry, 0);
      const causerID = dNum(entry, 6);
      const delta    = dNum(entry, 2);
      return {
        ...base,
        actorId:       objectId,
        actorName:     profile(objectId)?.name,
        actorGuild:    profile(objectId)?.guildName,
        targetId:      causerID,
        targetName:    profile(causerID)?.name,
        spellId:       dNum(entry, 7),
        damage:        delta,
        currentHealth: dNum(entry, 3),
      };
    }
    case 'health_updates': {
      // Data[0]=objectID, [2]=[healthDeltas], [3]=[healthsAfter], [6]=[causerIDs]
      const objectId = dNum(entry, 0);
      const deltas   = dNumArr(entry, 2);
      const totalDmg = deltas?.reduce((s, v) => s + v, 0);
      return {
        ...base,
        actorId:    objectId,
        actorName:  profile(objectId)?.name,
        actorGuild: profile(objectId)?.guildName,
        damage:     totalDmg,
      };
    }
    case 'energy_update': {
      // Data[0]=objectID, [2]=energyDelta, [3]=energyAfter
      const objectId = dNum(entry, 0);
      return {
        ...base,
        actorId:    objectId,
        actorName:  profile(objectId)?.name,
        actorGuild: profile(objectId)?.guildName,
        damage:     dNum(entry, 2),   // reuse damage field for delta
        currentHealth: dNum(entry, 3),
      };
    }
    case 'forced_movement': {
      // Data[0]=targetObjectID, [7]=spellID, [9]=sourceObjectID
      const targetId = dNum(entry, 0);
      const sourceId = dNum(entry, 9);
      return {
        ...base,
        actorId:    sourceId,
        actorName:  profile(sourceId)?.name,
        actorGuild: profile(sourceId)?.guildName,
        targetId,
        targetName: profile(targetId)?.name,
        targetGuild:profile(targetId)?.guildName,
        spellId:    dNum(entry, 7),
      };
    }
    case 'spell_effect_area': {
      // Data[4]=spellID, [6]=casterObjectID
      const casterId = dNum(entry, 6);
      return {
        ...base,
        actorId:   casterId,
        actorName: profile(casterId)?.name,
        actorGuild:profile(casterId)?.guildName,
        spellId:   dNum(entry, 4),
      };
    }
    case 'mounted': {
      // Data[0]=objectID, [2]=mountItemID, [5]=moveSpeed
      const objectId = dNum(entry, 0);
      return {
        ...base,
        actorId:     objectId,
        actorName:   profile(objectId)?.name,
        actorGuild:  profile(objectId)?.guildName,
        mountItemId: dNum(entry, 2),
      };
    }
    case 'mount_start': {
      // Data[0]=objectID, [2]=mountItemID
      const objectId = dNum(entry, 0);
      return {
        ...base,
        actorId:     objectId,
        actorName:   profile(objectId)?.name,
        actorGuild:  profile(objectId)?.guildName,
        mountItemId: dNum(entry, 2),
      };
    }
    default:
      return base;
  }
}

// ─── 主解析逻辑 ──────────────────────────────────────────────────────────────────

self.onmessage = (e: MessageEvent<string>) => {
  const text: string = e.data;
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const total = lines.length;

  const players: Record<number, PlayerProfile> = {};
  const playersByName: Record<string, PlayerProfile> = {};
  const events: BattleEvent[] = [];
  const guilds = new Set<string>();
  const alliances = new Set<string>();

  const PROGRESS_INTERVAL = 5000;

  for (let i = 0; i < lines.length; i++) {
    if (i % PROGRESS_INTERVAL === 0 && i > 0) {
      self.postMessage({ type: 'progress', parsed: i, total } satisfies WorkerMessage);
    }

    let entry: RawLogEntry;
    try {
      entry = JSON.parse(lines[i]);
    } catch {
      continue;
    }

    // 用 EventNewCharacter 建立玩家档案
    if (entry.Type === 0 && entry.Code === CODE_NEW_CHARACTER && entry.ObjectID !== undefined) {
      const existing = players[entry.ObjectID];
      const profile: PlayerProfile = {
        objectId:     entry.ObjectID,
        name:         entry.Name ?? existing?.name ?? `Unknown#${entry.ObjectID}`,
        guildName:    entry.GuildName ?? existing?.guildName ?? '',
        allianceName: entry.AllianceName ?? existing?.allianceName ?? '',
        equipmentIds: entry.EquipmentIDs ?? existing?.equipmentIds ?? [],
        spellIds:     entry.SpellIDs ?? existing?.spellIds ?? [],
        firstSeenTs:  existing?.firstSeenTs ?? entry.Ts,
        lastSeenTs:   entry.Ts,
        eventCount:   (existing?.eventCount ?? 0) + 1,
      };
      players[entry.ObjectID] = profile;
      if (profile.name) playersByName[profile.name] = profile;
      if (profile.guildName) guilds.add(profile.guildName);
      if (profile.allianceName) alliances.add(profile.allianceName);
    }

    // 更新 lastSeenTs 和 eventCount
    const actorId = entry.ObjectID ?? entry.CasterObjectID ?? entry.ObjectID1 ?? dNum(entry, 0);
    if (actorId !== undefined && players[actorId]) {
      players[actorId].lastSeenTs = entry.Ts;
      players[actorId].eventCount++;
    }

    events.push(buildEvent(entry, players));
  }

  events.sort((a, b) => a.ts - b.ts);

  const startTs = events[0]?.ts ?? 0;
  const endTs   = events[events.length - 1]?.ts ?? 0;

  const eventTypeCounts = events.reduce((acc, ev) => {
    acc[ev.type] = (acc[ev.type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>) as BattleSession['eventTypeCounts'];

  const session: BattleSession = {
    startTs, endTs,
    durationMs:   endTs - startTs,
    totalEvents:  events.length,
    events,
    players, playersByName,
    guilds:    [...guilds].filter(Boolean).sort(),
    alliances: [...alliances].filter(Boolean).sort(),
    eventTypeCounts,
  };

  self.postMessage({ type: 'done', session } satisfies WorkerMessage);
};
