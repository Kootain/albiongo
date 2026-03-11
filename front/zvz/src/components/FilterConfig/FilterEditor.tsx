import React, { useState, useEffect, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";
import { X, Plus, Trash2, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FilterFactory, FilterFactoryParam, saveCustomFactory } from "../../filters/skillUseFilters";
import { ItemSpellSelector } from "./ItemSpellSelector";

const TYPE_DEFINITIONS = `
  interface LocalizedText {
    "EN-US"?: string;
    "ZH-CN"?: string;
    [key: string]: string | undefined;
  }

  interface ItemData {
    Index: number;
    UniqueName: string;
    Name: LocalizedText;
    Description: LocalizedText;
    Tier: number;
    Enchant: number;
    NameID: string;
  }

  interface SpellData {
    Index: number;
    UniqueName: string;
    Name: LocalizedText;
    Description: LocalizedText;
  }

  interface Player {
    Name: string;
    GuildName: string;
    AllianceName: string;
    Equipments: number[];
    Spells: number[];
  }

  interface PlayerEquipment {
    MainHand: ItemData | null;
    OffHand: ItemData | null;
    Head: ItemData | null;
    Chest: ItemData | null;
    Shoes: ItemData | null;
    Bag: ItemData | null;
    Cape: ItemData | null;
    Mount: ItemData | null;
    Potion: ItemData | null;
    Food: ItemData | null;
  }

  // Global variables available in the filter context
  declare const user: Player;
  declare const spell: SpellData;
  declare const item: ItemData | undefined;
  declare const equipments: PlayerEquipment | undefined;
  declare const params: Record<string, any>;
`;

interface FilterEditorProps {
  initialFactory?: FilterFactory | null;
  onSave: () => void;
  onCancel: () => void;
}

export const FilterEditor: React.FC<FilterEditorProps> = ({ initialFactory, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [id, setId] = useState(initialFactory?.id || "");
  const [name, setName] = useState(initialFactory?.name || "");
  const [params, setParams] = useState<FilterFactoryParam[]>(initialFactory?.params || []);
  const [code, setCode] = useState(initialFactory?.code || "return true;");
  const [showItemSelector, setShowItemSelector] = useState(false);
  
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure TypeScript/JavaScript settings
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [1108], // Ignore "A 'return' statement can only be used within a function body."
    });

    // Compiler options
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
    });

    // Inject types
    const libUri = "ts:filename/types.d.ts";
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      TYPE_DEFINITIONS,
      libUri
    );
    
    // Create a model for the library to ensure it's loaded
    if (!monaco.editor.getModel(monaco.Uri.parse(libUri))) {
        monaco.editor.createModel(TYPE_DEFINITIONS, "typescript", monaco.Uri.parse(libUri));
    }
  };

  const handleAddParam = () => {
    setParams([...params, { name: "", type: "string", label: "" }]);
  };

  const handleRemoveParam = (index: number) => {
    const newParams = [...params];
    newParams.splice(index, 1);
    setParams(newParams);
  };

  const handleParamChange = (index: number, field: keyof FilterFactoryParam, value: string) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: value };
    setParams(newParams);
  };

  const handleSave = () => {
    if (!id || !name || !code) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      saveCustomFactory({
        id,
        name,
        params,
        create: () => () => false, // Placeholder, will be replaced by saveCustomFactory
        code,
        isCustom: true,
      });
      onSave();
    } catch (e) {
      alert("Error saving filter: " + e);
    }
  };

  const handleItemSelect = (itemName: string, itemId: number, uniqueId: string, type: 'item' | 'spell') => {
    if (editorRef.current) {
        const editor = editorRef.current;
        const position = editor.getPosition();
        // Generate a valid variable name based on type and id
        const varName = `${type}_${itemId}`;
        const text = ` // ${itemName} (${uniqueId})\nconst ${varName} = ${itemId};\n`;
        
        editor.executeEdits("item-selector", [{
            range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            },
            text: text,
            forceMoveMarkers: true
        }]);
        editor.focus();
    }
    setShowItemSelector(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-zinc-100">
          {initialFactory ? t("Edit Filter") : t("New Filter")}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            {t("Cancel")}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <Save size={18} />
            {t("Save Filter")}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Left Column: Metadata & Params */}
        <div className="space-y-6 overflow-y-auto pr-2">
          <div className="space-y-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-lg font-medium text-zinc-200">{t("Basic Info")}</h3>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">{t("Filter ID")}</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={!!initialFactory}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                placeholder="UNIQUE_ID"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">{t("Display Name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500"
                placeholder="My Custom Filter"
              />
            </div>
          </div>

          <div className="space-y-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-zinc-200">{t("Parameters")}</h3>
              <button
                onClick={handleAddParam}
                className="text-xs flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded transition-colors"
              >
                <Plus size={14} />
                {t("Add Param")}
              </button>
            </div>
            
            <div className="space-y-3">
              {params.map((param, index) => (
                <div key={index} className="flex gap-2 items-start bg-zinc-950 p-2 rounded border border-zinc-800/50">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => handleParamChange(index, "name", e.target.value)}
                      className="w-full bg-transparent border-b border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 pb-1"
                      placeholder="paramName"
                    />
                    <input
                      type="text"
                      value={param.label}
                      onChange={(e) => handleParamChange(index, "label", e.target.value)}
                      className="w-full bg-transparent border-b border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 pb-1"
                      placeholder="Display Label"
                    />
                    <select
                      value={param.type}
                      onChange={(e) => handleParamChange(index, "type", e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400 px-1 py-1"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleRemoveParam(index)}
                    className="text-zinc-600 hover:text-red-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {params.length === 0 && (
                <p className="text-xs text-zinc-500 italic text-center py-2">{t("No parameters defined")}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Code Editor */}
        <div className="lg:col-span-2 flex flex-col h-full bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-800 bg-zinc-900">
            <h3 className="text-sm font-medium text-zinc-300">{t("Filter Logic")}</h3>
            <button
              onClick={() => {
                setShowItemSelector(true);
              }}
              className="text-xs flex items-center gap-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/20 transition-colors"
            >
              <Plus size={14} />
              {t("Insert Item/Spell ID")}
            </button>
          </div>
          <div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
             <MonacoEditor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: '"Fira Code", "Fira Mono", monospace',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-500 font-mono">
            Arguments available: <span className="text-indigo-400">user</span>, <span className="text-indigo-400">spell</span>, <span className="text-indigo-400">item</span>, <span className="text-indigo-400">equipments</span>, <span className="text-indigo-400">params</span>
          </div>
        </div>
      </div>

      {showItemSelector && (
        <ItemSpellSelector
          onSelect={handleItemSelect}
          onClose={() => setShowItemSelector(false)}
        />
      )}
    </div>
  );
};
