import { Player, SpellData, ItemData } from "../types";

export type SkillUseFilter = (
  user: Player,
  spell: SpellData,
  item?: ItemData
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
}

export const filterFactories: Record<string, FilterFactory> = {};

export const registerFilterFactory = (factory: FilterFactory) => {
  filterFactories[factory.id] = factory;
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
  item?: ItemData
): boolean => {
  if (!strategy.rules || strategy.rules.length === 0) return false;
  
  for (const ruleConfig of strategy.rules) {
    const factory = filterFactories[ruleConfig.factoryId];
    if (!factory) return false; // Fail if factory not found
    const filter = factory.create(ruleConfig.params);
    if (!filter(user, spell, item)) {
      return false; // AND logic for rules within a strategy
    }
  }
  return true;
};

export const evaluateBlockFilterStrategies = (
  strategies: FilterStrategyConfig[],
  user: Player,
  spell: SpellData,
  item?: ItemData
): boolean => {
  if (!strategies || strategies.length === 0) return false;

  for (const strategy of strategies) {
    if (evaluateFilterStrategy(strategy, user, spell, item)) {
      return true; // OR logic for strategies
    }
  }
  return false;
};
