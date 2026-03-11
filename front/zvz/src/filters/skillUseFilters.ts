import { Player, SpellData, ItemData, PlayerEquipment } from "../types";

export type SkillUseFilter = (
  user: Player,
  spell: SpellData,
  item?: ItemData,
  equipments?: PlayerEquipment
) => boolean;

export interface FilterFactoryParam {
  name: string;
  type: "string" | "number" | "boolean";
  label: string;
}

export interface FilterFactory {
  id: string;
  name: string;
  params: FilterFactoryParam[];
  create: (params: Record<string, any>) => SkillUseFilter;
  code?: string; // Source code for custom filters
  isCustom?: boolean;
}

export const filterFactories: Record<string, FilterFactory> = {};
const CUSTOM_FACTORIES_KEY = "albiongo_custom_filters";

export const registerFilterFactory = (factory: FilterFactory) => {
  filterFactories[factory.id] = factory;
};

export const getCustomFactories = (): FilterFactory[] => {
  try {
    const data = localStorage.getItem(CUSTOM_FACTORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load custom filters:", e);
    return [];
  }
};

export const saveCustomFactory = (factory: FilterFactory) => {
  if (!factory.code) return;
  
  // Ensure we can reconstruct the create function from code
  try {
    // Test compilation
    new Function('user', 'spell', 'item', 'equipments', 'params', factory.code);
    
    // Assign the create function
    factory.create = (params: Record<string, any>) => {
      try {
        const func = new Function('user', 'spell', 'item', 'equipments', 'params', factory.code!);
        return (u, s, i, e) => {
          try {
            return func(u, s, i, e, params);
          } catch (err) {
            console.error(`Error executing filter ${factory.id}:`, err);
            return false;
          }
        };
      } catch (err) {
        console.error(`Error creating filter ${factory.id}:`, err);
        return () => false;
      }
    };
    
    factory.isCustom = true;
    registerFilterFactory(factory);
    
    // Save to localStorage
    const customFactories = getCustomFactories();
    const index = customFactories.findIndex(f => f.id === factory.id);
    if (index >= 0) {
      customFactories[index] = { ...factory, create: undefined as any }; // Don't save function
    } else {
      customFactories.push({ ...factory, create: undefined as any });
    }
    localStorage.setItem(CUSTOM_FACTORIES_KEY, JSON.stringify(customFactories));
    
  } catch (e) {
    console.error("Invalid filter code:", e);
    throw e;
  }
};

export const deleteCustomFactory = (id: string) => {
  delete filterFactories[id];
  const customFactories = getCustomFactories().filter(f => f.id !== id);
  localStorage.setItem(CUSTOM_FACTORIES_KEY, JSON.stringify(customFactories));
};

export const loadCustomFactories = () => {
  const factories = getCustomFactories();
  factories.forEach(f => {
    if (f.code) {
      saveCustomFactory(f); // Re-register and compile
    }
  });
};

// Built-in factories
registerFilterFactory({
  id: "USERNAME",
  name: "Username",
  params: [{ name: "username", type: "string", label: "Username" }],
  create: (params) => {
    return (user: Player) => user.Name === params.username;
  },
});

registerFilterFactory({
  id: "SPELL_ID",
  name: "Spell ID",
  params: [{ name: "spellId", type: "number", label: "Spell ID" }],
  create: (params) => {
    return (_, spell: SpellData) => spell.Index === Number(params.spellId);
  },
});

registerFilterFactory({
  id: "GuildName",
  name: "GuildName",
  params: [{name: "guildName", type: "string", label: "Guild Name"}],
  create: (params) => {
    return (user: Player) => user.GuildName === params.guildName;
  }
});

export interface FilterRuleConfig {
  factoryId: string;
  params: Record<string, any>;
}

export interface FilterStrategyConfig {
  id: string;
  rules: FilterRuleConfig[];
}

export const evaluateFilterStrategy = (
  strategy: FilterStrategyConfig,
  user: Player,
  spell: SpellData,
  item?: ItemData,
  equipments?: PlayerEquipment
): boolean => {
  if (!strategy.rules || strategy.rules.length === 0) return false;
  
  for (const ruleConfig of strategy.rules) {
    const factory = filterFactories[ruleConfig.factoryId];
    if (!factory) continue; // Fail if factory not found
    const filter = factory.create(ruleConfig.params);
    if (!filter(user, spell, item, equipments)) {
      return false; // AND logic for rules within a strategy
    }
  }
  return true;
};

export const evaluateBlockFilterStrategies = (
  strategies: FilterStrategyConfig[],
  user: Player,
  spell: SpellData,
  item?: ItemData,
  equipments?: PlayerEquipment
): boolean => {
  if (!strategies || strategies.length === 0) return false;

  for (const strategy of strategies) {
    if (evaluateFilterStrategy(strategy, user, spell, item, equipments)) {
      return true; // OR logic for strategies
    }
  }
  return false;
};
