// ─── 协议事件类型 ───────────────────────────────────────────────────────────────

/** JSONL 中的原始日志行 */
export interface RawLogEntry {
  Type: 0 | 1 | 2;   // 0=Event, 1=OperationRequest, 2=OperationResponse
  Code: number;
  Ts: number;         // Unix 毫秒时间戳
  ObjectID?: number;

  // Code 29: EventNewCharacter
  Name?: string;
  GuildName?: string;
  AllianceName?: string;
  EquipmentIDs?: number[];
  SpellIDs?: number[];

  // Code 19: EventCastSpell
  CasterObjectID?: number;
  CasterName?: string;
  TargetObjectID?: number;
  TargetName?: string;
  SpellIndex?: number;

  // Code 21: EventCastHit
  ObjectID1?: number;
  ObjectID2?: number;

  // Code 90: EventCharacterEquipmentChanged
  // ObjectID + Name + EquipmentIDs + SpellIDs（复用上面字段）

  // Code 11: EventActiveSpellEffectsUpdate
  CauserIDs?: number[];

  // 其他未解析事件（Data 数字键格式，键为字符串化的 uint8）
  Data?: Record<string, unknown>;
}

// ─── 处理后的业务类型 ────────────────────────────────────────────────────────────

export type EventType =
  | 'new_character'     // Code 29：玩家进入视野
  | 'leave'             // Code 1：玩家离开
  | 'cast_spell'        // Code 19：施法
  | 'cast_hit'          // Code 21：命中
  | 'cast_hits'         // Code 22：批量命中（AoE）
  | 'cast_start'        // Code 14：开始施法
  | 'cast_finished'     // Code 18：施法完成
  | 'attack'            // Code 13：普通攻击
  | 'health_update'     // Code 6：单次血量变化
  | 'health_updates'    // Code 7：批量血量变化
  | 'energy_update'     // Code 8：能量变化
  | 'equipment_change'  // Code 90：装备变化
  | 'kill'              // Code 165：死亡/击杀
  | 'forced_movement'   // Code 141：强制位移（CC/击退）
  | 'spell_effect_area' // Code 113：持续 AoE 区域
  | 'mounted'           // Code 209：骑乘完成
  | 'mount_start'       // Code 210：开始骑乘
  | 'unknown';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  new_character:    '玩家出现',
  leave:            '玩家离开',
  cast_spell:       '施法',
  cast_hit:         '命中',
  cast_hits:        '批量命中',
  cast_start:       '施法开始',
  cast_finished:    '施法完成',
  attack:           '普通攻击',
  health_update:    '血量变化',
  health_updates:   '批量血量变化',
  energy_update:    '能量变化',
  equipment_change: '装备变化',
  kill:             '击杀',
  forced_movement:  '强制位移',
  spell_effect_area:'AoE区域',
  mounted:          '骑乘',
  mount_start:      '开始骑乘',
  unknown:          '未知',
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  new_character:    '#4ade80',  // green-400
  leave:            '#71717a',  // zinc-500
  cast_spell:       '#818cf8',  // indigo-400
  cast_hit:         '#fb923c',  // orange-400
  cast_hits:        '#f97316',  // orange-500
  cast_start:       '#a78bfa',  // violet-400
  cast_finished:    '#c084fc',  // purple-400
  attack:           '#fbbf24',  // amber-400
  health_update:    '#f43f5e',  // rose-500
  health_updates:   '#e11d48',  // rose-600
  energy_update:    '#60a5fa',  // blue-400
  equipment_change: '#facc15',  // yellow-400
  kill:             '#f87171',  // red-400
  forced_movement:  '#22d3ee',  // cyan-400
  spell_effect_area:'#e879f9',  // fuchsia-400
  mounted:          '#a3e635',  // lime-400
  mount_start:      '#84cc16',  // lime-500
  unknown:          '#3f3f46',  // zinc-700
};

/** 处理后的战斗事件 */
export interface BattleEvent {
  id: string;
  ts: number;
  type: EventType;

  // 涉及的玩家
  actorId?: number;
  actorName?: string;
  actorGuild?: string;
  actorAlliance?: string;

  targetId?: number;
  targetName?: string;
  targetGuild?: string;

  // 战斗数据
  spellId?: number;
  equipmentIds?: number[];
  damage?: number;          // 伤害/治疗量（负=伤害，正=治疗）
  currentHealth?: number;   // 变化后血量
  mountItemId?: number;     // 坐骑道具 ID

  raw: RawLogEntry;  // 原始数据，用于抽屉详情展示
}

/** 玩家档案（从 EventNewCharacter 构建） */
export interface PlayerProfile {
  objectId: number;
  name: string;
  guildName: string;
  allianceName: string;
  equipmentIds: number[];
  spellIds: number[];
  firstSeenTs: number;
  lastSeenTs: number;
  eventCount: number;
}

/** Worker 处理完成后返回的战斗数据 */
export interface BattleSession {
  startTs: number;
  endTs: number;
  durationMs: number;
  totalEvents: number;
  events: BattleEvent[];                       // 按时间戳排序
  players: Record<number, PlayerProfile>;      // objectId → profile
  playersByName: Record<string, PlayerProfile>; // name → profile
  guilds: string[];
  alliances: string[];
  eventTypeCounts: Record<EventType, number>;
}

// ─── Worker 通信类型 ─────────────────────────────────────────────────────────────

export type WorkerMessage =
  | { type: 'progress'; parsed: number; total: number }
  | { type: 'done'; session: BattleSession }
  | { type: 'error'; message: string };

// ─── UI 过滤器 ───────────────────────────────────────────────────────────────────

export interface EventFilters {
  eventTypes: Set<EventType>;
  guilds: Set<string>;
  playerName: string;
}

// ─── Canvas 时间轴视口状态 ────────────────────────────────────────────────────────

export interface TimelineViewport {
  startTs: number;   // 左边界时间戳
  endTs: number;     // 右边界时间戳
  scrollY: number;   // 纵向滚动偏移（像素）
}
