import { useEffect, useRef } from "react";
import { usePlayerStore } from "../store/usePlayerStore";
import { useMonitorStore } from "../store/useMonitorStore";
import { useEventStore } from "../store/useEventStore";
import {
  eventRegistry,
  NewCharacterEvent,
  CharacterEquipmentChangedEvent,
  CastSpellEvent,
  BaseEvent,
} from "../events";
import { getSpell, getItem } from "../utils/dataManager";
import { evaluateBlockFilterStrategies } from "../filters/skillUseFilters";
import { ItemData, PlayerEquipment } from "../types";

const host = "127.0.0.1:8081";

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const setPlayers = usePlayerStore((state) => state.setPlayers);
  const addOrUpdatePlayer = usePlayerStore((state) => state.addOrUpdatePlayer);
  const blocks = useMonitorStore((state) => state.blocks);
  const triggerBlock = useEventStore((state) => state.triggerBlock);

  const blocksRef = useRef(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    // Initial fetch
    fetch(`http://${host}/players`)
      .then((res) => res.json())
      .then((data) => setPlayers(data))
      .catch((err) => console.error("Failed to load players:", err));

    const handleNewCharacter = (data: NewCharacterEvent) => {
      addOrUpdatePlayer({
        Name: data.Name,
        GuildName: data.GuildName || "",
        AllianceName: data.AllianceName || "",
        Equipments: data.EquipmentIDs || [],
        Spells: data.SpellIDs || [],
        UpdateTime: Date.now(),
      });
    };

    const handleEquipmentChanged = (data: CharacterEquipmentChangedEvent) => {
      addOrUpdatePlayer({
        Name: data.Name,
        GuildName: data.GuildName || "", // Might be missing in event, state update logic should preserve
        AllianceName: data.AllianceName || "",
        Equipments: data.EquipmentIDs || [],
        Spells: data.SpellIDs || [],
        UpdateTime: Date.now(),
      });
    };

    const handleSkillUse = (data: CastSpellEvent) => {
      const { CasterName, SpellIndex } = data;
      
      const user = usePlayerStore.getState().players.find(p => p.Name === CasterName);
      if (!user) return;

      const spell = getSpell(SpellIndex);
      if (!spell) return;

      let item: ItemData | undefined = undefined;
      const spellIndex = (user.Spells || []).indexOf(SpellIndex);
      
      if (spellIndex !== -1) {
        let eqIndex = -1;
        if (spellIndex >= 0 && spellIndex <= 2) eqIndex = 0; // Weapon
        else if (spellIndex === 3) eqIndex = 3; // Chest
        else if (spellIndex === 4) eqIndex = 2; // Head
        else if (spellIndex === 5) eqIndex = 4; // Shoes
        
        if (eqIndex !== -1) {
          const eqId = (user.Equipments || [])[eqIndex];
          if (eqId > 0) {
            item = getItem(eqId);
          }
        }
      }

      // Find if this Name + SpellID is assigned to any block, or matches the block's filter config
      
      const getEqItem = (idx: number) => {
        const id = (user.Equipments || [])[idx];
        return id && id > 0 ? getItem(id) || null : null;
      };

      const playerEquipment: PlayerEquipment = {
        MainHand: getEqItem(0),
        OffHand: getEqItem(1),
        Head: getEqItem(2),
        Chest: getEqItem(3),
        Shoes: getEqItem(4),
        Bag: getEqItem(5),
        Cape: getEqItem(6),
        Mount: getEqItem(7),
        Potion: getEqItem(8),
        Food: getEqItem(9),
      };

      blocksRef.current.forEach((block) => {
        // 1. Check dynamic assignments from UI (legacy)
        const assignmentMatches = block.assignments.some(
          (a) => a.playerName === CasterName && a.spellId === SpellIndex,
        );
        
        // 2. Check UI-configured filter strategies
        const passesFilters = evaluateBlockFilterStrategies(block.filterStrategies || [], user, spell, item, playerEquipment);

        if (assignmentMatches || passesFilters) {
          triggerBlock(block.id);
        }
      });
    };

    eventRegistry.register(29, handleNewCharacter);
    eventRegistry.register(90, handleEquipmentChanged);
    eventRegistry.register(19, handleSkillUse);

    const connect = () => {
      const wsUrl = `ws://${host}/events`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          if (event.data === '') {
            console.log(`Empty message received, ignoring`);
            return;
          }
          const data: BaseEvent = JSON.parse(event.data);
          if (data.Type === 0) {
            eventRegistry.dispatch(data);
          }
        } catch (e) {
          console.log("Failed to parse WS message", event);
          console.error("Failed to parse WS message", e);
        }
      };

      let isClosed = false;
      ws.onclose = (event) => {
        if (isClosed) return;
        isClosed = true;
        console.log(`WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}, WasClean: ${event.wasClean}`);
        console.log("Reconnecting...");
        setTimeout(connect, 3000);
      };

      wsRef.current = ws;

      return () => {
        console.log("Frontend actively closing WebSocket connection");
        isClosed = true;
        ws.close();
      };
    };

    const cleanup = connect();

    return () => {
      if (cleanup) cleanup();
      eventRegistry.unregister(29, handleNewCharacter);
      eventRegistry.unregister(90, handleEquipmentChanged);
      eventRegistry.unregister(19, handleSkillUse);
    };
  }, [triggerBlock, addOrUpdatePlayer, setPlayers]);
};
