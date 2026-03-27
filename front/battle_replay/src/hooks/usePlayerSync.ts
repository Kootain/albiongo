import { useEffect } from 'react';
import { useBattleStore } from '../store/useBattleStore';
import type { PlayerProfile } from '../types';

/** 服务端 /players 接口返回的单条记录 */
interface ServerPlayer {
  Name:         string;
  GuildName:    string;
  AllianceName: string;
  Equipments:   number[];
  Spells:       number[];
  UpdateTime:   number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8081';

/**
 * 拉取服务端全量玩家列表，写入 BattleSession.players / playersByName / guilds / alliances。
 * 用于实时模式下前端中途连入时补全玩家信息（用于过滤搜索）。
 * 仅在 isLive 时挂载，session 初始化后执行一次。
 */
export function usePlayerSync() {
  const isLive  = useBattleStore(s => s.isLive);
  const session = useBattleStore(s => s.session);

  useEffect(() => {
    if (!isLive || !session) return;

    let cancelled = false;

    fetch(`${API_BASE}/players`)
      .then(r => r.json())
      .then((list: ServerPlayer[]) => {
        if (cancelled) return;

        const players: Record<number, PlayerProfile>  = { ...session.players };
        const playersByName: Record<string, PlayerProfile> = { ...session.playersByName };
        const guilds    = new Set(session.guilds);
        const alliances = new Set(session.alliances);

        // 服务端没有 objectId，用 name 作为 key 存入 playersByName
        // players (objectId map) 保持不变，搜索走 playersByName
        list.forEach(p => {
          const profile: PlayerProfile = {
            objectId:     0,   // 服务端 /players 不返回 objectId
            name:         p.Name,
            guildName:    p.GuildName,
            allianceName: p.AllianceName,
            equipmentIds: p.Equipments,
            spellIds:     p.Spells,
            firstSeenTs:  p.UpdateTime,
            lastSeenTs:   p.UpdateTime,
            eventCount:   0,
          };
          playersByName[p.Name] = profile;
          if (p.GuildName)    guilds.add(p.GuildName);
          if (p.AllianceName) alliances.add(p.AllianceName);
        });

        // 直接 patch store 里的 session（不触发 filteredEvents 重算）
        useBattleStore.setState(s => ({
          session: s.session ? {
            ...s.session,
            players,
            playersByName,
            guilds:    [...guilds].filter(Boolean).sort(),
            alliances: [...alliances].filter(Boolean).sort(),
          } : null,
        }));
      })
      .catch(() => { /* 服务端未启动时静默失败 */ });

    return () => { cancelled = true; };
  // 仅在 isLive 切换或 session 初始化时执行一次
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, !!session]);
}
