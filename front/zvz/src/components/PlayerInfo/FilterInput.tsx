import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";

interface FilterInputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder: string;
  suggestions?: string[];
  multiSelect?: boolean;
  onClear?: () => void;
  onClick?: () => void;
  readOnly?: boolean;
  type?: "text" | "number";
}

export const FilterInput: React.FC<FilterInputProps> = ({
  value,
  onChange,
  placeholder,
  suggestions = [],
  multiSelect = false,
  onClear,
  onClick,
  readOnly = false,
  type = "text",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse selected values for multi-select logic
  const selectedValues = useMemo(() => {
    if (value === "" || value === undefined || value === null || value === 0) return [];
    return multiSelect ? String(value).split(",").filter(Boolean) : [String(value)];
  }, [value, multiSelect]);

  // Determine what to show in the input field
  const displayValue = useMemo(() => {
    if (multiSelect) {
      // In multi-select mode:
      // If open, show the user's search term (so they can filter)
      // If closed, show the comma-separated selected values
      return isOpen ? searchTerm : selectedValues.join(", ");
    }
    // In single-select mode, the input value is the value itself
    return value === 0 && type === 'number' ? '' : value; 
  }, [multiSelect, isOpen, searchTerm, selectedValues, value, type]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm(""); // Clear search term on close for multi-select
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    
    if (multiSelect) {
      setSearchTerm(newVal);
      setIsOpen(true);
    } else {
      // For single select, update value immediately
      if (type === 'number') {
         const num = parseInt(newVal);
         onChange(isNaN(num) ? 0 : num);
      } else {
         onChange(newVal);
      }
      setIsOpen(true);
    }
  };

  const handleSelect = (item: string) => {
    if (multiSelect) {
      const newSelected = selectedValues.includes(item)
        ? selectedValues.filter((v) => v !== item)
        : [...selectedValues, item];
      onChange(newSelected.join(","));
      // Don't close dropdown for multi-select
      inputRef.current?.focus();
    } else {
      onChange(type === 'number' ? Number(item) : item);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(type === 'number' ? 0 : "");
    setSearchTerm("");
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  const handleInputClick = () => {
    if (onClick) onClick();
    if (!readOnly) {
        setIsOpen(true);
        // If multi-select and clicking to open, maybe clear previous search term or keep it?
        // Let's keep it empty to show all suggestions initially or allow fresh search
    }
  };

  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    const term = multiSelect ? searchTerm : String(value);
    // If term is empty, show all suggestions
    // If single select and value is 0 (for number), show all
    if (!term || (type === 'number' && value === 0)) return suggestions;
    
    return suggestions.filter(s => 
      s.toLowerCase().includes(term.toLowerCase())
    );
  }, [suggestions, searchTerm, value, multiSelect, type]);

  // Split into selected and unselected for the sticky header requirement
  const { selectedItems, unselectedItems } = useMemo(() => {
    if (!multiSelect) return { selectedItems: [], unselectedItems: filteredSuggestions };
    
    const selected = filteredSuggestions.filter(s => selectedValues.includes(s));
    const unselected = filteredSuggestions.filter(s => !selectedValues.includes(s));
    return { selectedItems: selected, unselectedItems: unselected };
  }, [filteredSuggestions, selectedValues, multiSelect]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center w-full">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none z-10"
          size={14}
        />
        <input
          ref={inputRef}
          type={type === 'number' && !multiSelect ? "number" : "text"}
          readOnly={readOnly}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onFocus={() => !readOnly && setIsOpen(true)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder-zinc-500"
        />
        
        {value ? (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
          >
            <X size={14} />
          </button>
        ) : (
          !readOnly && <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
        )}
      </div>

      {isOpen && suggestions.length > 0 && !readOnly && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden max-h-60 flex flex-col">
          {/* Sticky Header for Selected Items (Multi-select only) */}
          {multiSelect && selectedItems.length > 0 && (
            <div className="bg-zinc-800/80 backdrop-blur-sm border-b border-zinc-700 shrink-0 max-h-32 overflow-y-auto custom-scrollbar z-10">
              {selectedItems.map((item) => (
                <div
                  key={item}
                  className="px-3 py-2 text-sm text-indigo-300 hover:bg-zinc-700 cursor-pointer flex items-center justify-between"
                  onClick={() => handleSelect(item)}
                >
                  <span>{item}</span>
                  <Check size={14} className="text-indigo-400" />
                </div>
              ))}
            </div>
          )}
          
          {/* Scrollable Body for Unselected Items */}
          <div className="overflow-y-auto custom-scrollbar flex-1">
            {unselectedItems.map((item) => (
              <div
                key={item}
                className={`px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 cursor-pointer flex items-center justify-between ${
                  selectedValues.includes(item) && !multiSelect ? 'bg-zinc-800 text-indigo-300' : ''
                }`}
                onClick={() => handleSelect(item)}
              >
                <span>{item}</span>
                {selectedValues.includes(item) && !multiSelect && <Check size={14} className="text-indigo-400" />}
              </div>
            ))}
            {unselectedItems.length === 0 && selectedItems.length === 0 && (
              <div className="px-3 py-2 text-sm text-zinc-500 italic">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
