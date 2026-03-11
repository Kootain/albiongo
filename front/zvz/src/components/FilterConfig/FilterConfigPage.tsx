import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { FilterFactory, getCustomFactories, deleteCustomFactory } from "../../filters/skillUseFilters";
import { FilterEditor } from "./FilterEditor";

export const FilterConfigPage: React.FC = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FilterFactory[]>([]);
  const [editingFilter, setEditingFilter] = useState<FilterFactory | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const loadFilters = () => {
    setFilters(getCustomFactories());
  };

  useEffect(() => {
    loadFilters();
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm(t("Are you sure you want to delete this filter?"))) {
      deleteCustomFactory(id);
      loadFilters();
    }
  };

  if (isEditing) {
    return (
      <FilterEditor
        initialFactory={editingFilter}
        onSave={() => {
          setIsEditing(false);
          setEditingFilter(null);
          loadFilters();
        }}
        onCancel={() => {
          setIsEditing(false);
          setEditingFilter(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">{t("Filter Strategies")}</h2>
          <p className="text-zinc-400 text-sm mt-1">
            {t("Manage custom filter strategies for skill monitoring.")}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingFilter(null);
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          <Plus size={18} />
          {t("New Filter")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filters.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
            <p>{t("No custom filters found")}</p>
            <button
              onClick={() => {
                setEditingFilter(null);
                setIsEditing(true);
              }}
              className="mt-4 text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              {t("Create your first filter")}
            </button>
          </div>
        ) : (
          filters.map((filter) => (
            <div
              key={filter.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-zinc-200">{filter.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingFilter(filter);
                      setIsEditing(true);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded transition-colors"
                    title={t("Edit")}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(filter.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                    title={t("Delete")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-zinc-500 font-mono mb-4">{t("ID")}: {filter.id}</div>
              
              <div className="space-y-2">
                <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{t("Parameters")}</div>
                <div className="flex flex-wrap gap-2">
                  {filter.params && filter.params.length > 0 ? (
                    filter.params.map((param, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-300"
                      >
                        {param.name}: {param.type}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-600 italic">{t("None")}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
