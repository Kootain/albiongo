import React from "react";
import { useTranslation } from "react-i18next";
import { FilterStrategyConfig, filterFactories, FilterRuleConfig } from "../../filters/skillUseFilters";
import { Plus, Trash2 } from "lucide-react";

interface FilterStrategyEditorProps {
  strategy: FilterStrategyConfig;
  onChange: (strategy: FilterStrategyConfig) => void;
  onRemove: () => void;
}

export const FilterStrategyEditor: React.FC<FilterStrategyEditorProps> = ({
  strategy,
  onChange,
  onRemove,
}) => {
  const { t } = useTranslation();

  const handleAddRule = () => {
    const firstFactoryId = Object.keys(filterFactories)[0];
    if (!firstFactoryId) return;

    const newRule: FilterRuleConfig = {
      factoryId: firstFactoryId,
      params: {},
    };
    onChange({
      ...strategy,
      rules: [...strategy.rules, newRule],
    });
  };

  const handleRemoveRule = (index: number) => {
    const newRules = [...strategy.rules];
    newRules.splice(index, 1);
    onChange({
      ...strategy,
      rules: newRules,
    });
  };

  const handleRuleChange = (index: number, newRule: FilterRuleConfig) => {
    const newRules = [...strategy.rules];
    newRules[index] = newRule;
    onChange({
      ...strategy,
      rules: newRules,
    });
  };

  return (
    <div className="bg-zinc-700/50 p-3 rounded-lg border border-zinc-600 mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-zinc-300">
          {t("Filter Strategy")} (OR)
        </span>
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 p-1"
          title={t("Remove Strategy")}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-2 pl-2 border-l-2 border-zinc-600">
        {strategy.rules.map((rule, idx) => {
          const factory = filterFactories[rule.factoryId];
          return (
            <div key={idx} className="bg-zinc-800 p-2 rounded flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <select
                  value={rule.factoryId}
                  onChange={(e) =>
                    handleRuleChange(idx, {
                      factoryId: e.target.value,
                      params: {}, // Reset params when factory changes
                    })
                  }
                  className="bg-zinc-900 text-xs text-white p-1 rounded border border-zinc-700"
                >
                  {Object.values(filterFactories).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleRemoveRule(idx)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {factory && factory.params.map((param) => (
                <div key={param.name} className="flex items-center gap-2">
                  <label className="text-xs text-zinc-400 w-20 truncate">
                    {param.label}
                  </label>
                  {param.type === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={!!rule.params[param.name]}
                      onChange={(e) =>
                        handleRuleChange(idx, {
                          ...rule,
                          params: {
                            ...rule.params,
                            [param.name]: e.target.checked,
                          },
                        })
                      }
                      className="rounded bg-zinc-900 border-zinc-700"
                    />
                  ) : (
                    <input
                      type={param.type === "number" ? "number" : "text"}
                      value={rule.params[param.name] || ""}
                      onChange={(e) =>
                        handleRuleChange(idx, {
                          ...rule,
                          params: {
                            ...rule.params,
                            [param.name]:
                              param.type === "number"
                                ? Number(e.target.value)
                                : e.target.value,
                          },
                        })
                      }
                      className="flex-1 bg-zinc-900 text-xs text-white p-1 rounded border border-zinc-700"
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })}

        <button
          onClick={handleAddRule}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2"
        >
          <Plus size={12} /> {t("Add Rule")} (AND)
        </button>
      </div>
    </div>
  );
};
