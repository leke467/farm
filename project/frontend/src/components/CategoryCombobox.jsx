import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiPlus, FiCheck, FiInfo } from 'react-icons/fi';

/**
 * CategoryCombobox - Hybrid Select + Free-text Input component.
 * Gives users preset category ideas in a dropdown menu while allowing
 * them to type any custom category name freely.
 */

const DEFAULT_PRESETS = [
  { value: 'feed', label: 'Feed & Fodder', icon: '📦' },
  { value: 'fertilizer', label: 'Fertilizer & Soil Care', icon: '🌱' },
  { value: 'medical', label: 'Medical & Vaccines', icon: '💉' },
  { value: 'infrastructure', label: 'Infrastructure & Hardware', icon: '🏗️' },
  { value: 'fuel', label: 'Fuel & Energy', icon: '⛽' },
  { value: 'tools', label: 'Tools & Equipment', icon: '🛠️' },
  { value: 'seeds', label: 'Seeds & Seedlings', icon: '🌾' },
  { value: 'packaging', label: 'Packaging & Storage', icon: '📦' },
  { value: 'produce', label: 'Produce & Harvest', icon: '🍎' },
  { value: 'equipment', label: 'Equipment & Machinery', icon: '🚜' },
  { value: 'maintenance', label: 'Maintenance & Repairs', icon: '🔧' },
  { value: 'labor', label: 'Labor & Services', icon: '👷' },
  { value: 'other', label: 'Other Category', icon: '✨' },
];

export default function CategoryCombobox({
  value = '',
  onChange,
  suggestions = [],
  useDefaultPresets = false,
  placeholder = 'Type custom or select from dropdown...',
  label,
  required = false,
  id,
  name,
  className = '',
  helperText,
  explanation,
}) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const hint = helperText || explanation;

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Combine passed suggestions with default presets
  const combinedSuggestions = (() => {
    const map = new Map();
    const hasCustomSuggestions = suggestions && suggestions.length > 0;

    // First add passed suggestions if available
    (suggestions || []).forEach(s => {
      if (typeof s === 'string') {
        const key = s.toLowerCase();
        map.set(key, { value: s, label: s.charAt(0).toUpperCase() + s.slice(1), icon: '🏷️' });
      } else if (s && (s.value || s.label)) {
        const val = s.value || s.label;
        map.set(val.toLowerCase(), {
          value: val,
          label: s.label || val,
          icon: s.icon || '🏷️'
        });
      }
    });

    // Add default presets only if custom suggestions were not provided or useDefaultPresets is true
    if (!hasCustomSuggestions || useDefaultPresets) {
      DEFAULT_PRESETS.forEach(p => {
        if (!map.has(p.value.toLowerCase()) && !map.has(p.label.toLowerCase())) {
          map.set(p.value.toLowerCase(), p);
        }
      });
    }

    return Array.from(map.values());
  })();

  // Filter based on input value
  const search = (inputValue || '').trim().toLowerCase();
  const filtered = combinedSuggestions.filter(s =>
    s.label.toLowerCase().includes(search) || s.value.toLowerCase().includes(search)
  );

  const exactMatchExists = combinedSuggestions.some(
    s => s.value.toLowerCase() === search || s.label.toLowerCase() === search
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    setSelectedIndex(0);
    onChange(val);
  };

  const handleSelect = (val) => {
    setInputValue(val);
    onChange(val);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      const total = filtered.length + (!exactMatchExists && search ? 1 : 0);
      setSelectedIndex(prev => (prev + 1) % Math.max(1, total));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const total = filtered.length + (!exactMatchExists && search ? 1 : 0);
      setSelectedIndex(prev => (prev - 1 + total) % Math.max(1, total));
    } else if (e.key === 'Enter') {
      if (isOpen) {
        e.preventDefault();
        if (!exactMatchExists && search && selectedIndex === 0) {
          handleSelect(inputValue.trim());
        } else {
          const itemIdx = !exactMatchExists && search ? selectedIndex - 1 : selectedIndex;
          if (filtered[itemIdx]) {
            handleSelect(filtered[itemIdx].value);
          } else if (inputValue.trim()) {
            handleSelect(inputValue.trim());
          }
        }
      }
    }
  };

  return (
    <div ref={wrapperRef} className={`category-combobox ${className}`} style={{ position: 'relative' }}>
      {label ? (
        <div className="flex items-center gap-1.5 mb-1.5">
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            <span>{label}</span>
            {required ? <span className="text-red-500 ml-1">*</span> : null}
          </label>
          {hint ? (
            <div className="relative group flex items-center">
              <FiInfo className="w-3.5 h-3.5 text-gray-400 hover:text-green-600 transition-colors cursor-help flex-shrink-0" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-slate-900 text-white text-xs rounded-md shadow-xl z-50 pointer-events-none leading-relaxed text-center font-normal">
                <span>{hint}</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="input w-full text-base pr-10 border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
          autoComplete="off"
        />

        <button
          type="button"
          onClick={handleToggle}
          tabIndex={-1}
          className="absolute right-2 p-1.5 text-gray-400 hover:text-gray-600 focus:outline-none rounded-md"
          title="Toggle Category Options"
        >
          {isOpen ? <FiChevronUp className="w-5 h-5 text-green-600" /> : <FiChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
      </div>

      {isOpen && (
        <div
          className="category-combobox-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            maxHeight: '240px',
            overflowY: 'auto',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            marginTop: '4px',
            padding: '4px 0',
          }}
        >
          {/* Custom option prompt if user is typing something not in presets */}
          {!exactMatchExists && search && (
            <div
              onClick={() => handleSelect(inputValue.trim())}
              style={{
                padding: '0.6rem 0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                background: selectedIndex === 0 ? '#f0fdf4' : 'transparent',
                color: '#15803d',
                borderBottom: '1px solid #f3f4f6',
              }}
              onMouseEnter={() => setSelectedIndex(0)}
            >
              <FiPlus className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Use <strong>"{inputValue.trim()}"</strong> as custom category</span>
            </div>
          )}

          {/* List of preset suggestions */}
          {filtered.length > 0 ? (
            filtered.map((s, idx) => {
              const actualIdx = !exactMatchExists && search ? idx + 1 : idx;
              const isSelected = selectedIndex === actualIdx;
              const isCurrentValue = value.toLowerCase() === s.value.toLowerCase() || value.toLowerCase() === s.label.toLowerCase();

              return (
                <div
                  key={s.value + idx}
                  onClick={() => handleSelect(s.value)}
                  style={{
                    padding: '0.55rem 0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    background: isSelected ? '#f3f4f6' : isCurrentValue ? '#ecfdf5' : 'transparent',
                    color: isCurrentValue ? '#047857' : '#374151',
                    fontWeight: isCurrentValue ? 600 : 400,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={() => setSelectedIndex(actualIdx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {s.icon && <span style={{ fontSize: '1rem' }}>{s.icon}</span>}
                    <span>{s.label}</span>
                  </div>
                  {isCurrentValue && <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0" />}
                </div>
              );
            })
          ) : (
            !search && (
              <div style={{ padding: '0.75rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                No categories available. Type to create a custom category!
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
