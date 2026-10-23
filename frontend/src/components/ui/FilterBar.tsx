import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import Button from './Button';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  placeholder?: string;
  options?: FilterOption[];
}

export interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  className?: string;
  actionButton?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  values,
  onChange,
  onClear,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  className = '',
  actionButton,
}) => {
  // Calculate active filter count
  const activeCount = Object.entries(values).filter(([_, val]) => {
    return val !== undefined && val !== null && val !== '';
  }).length + (searchValue ? 1 : 0);

  return (
    <div className={`bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-4 space-y-3 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Search and Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Free Text Search */}
          {onSearchChange !== undefined && (
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-gray-900 transition-colors"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Dynamic Select / Date Filters */}
          {filters.map((filter) => {
            const currentValue = values[filter.key] ?? '';

            if (filter.type === 'select') {
              return (
                <div key={filter.key} className="min-w-[140px]">
                  <select
                    value={currentValue}
                    onChange={(e) => onChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-gray-800"
                  >
                    <option value="">{filter.placeholder || `All ${filter.label}`}</option>
                    {filter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (filter.type === 'date') {
              return (
                <div key={filter.key} className="min-w-[130px]">
                  <input
                    type="date"
                    value={currentValue}
                    onChange={(e) => onChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-gray-800"
                  />
                </div>
              );
            }

            return (
              <div key={filter.key} className="min-w-[140px]">
                <input
                  type="text"
                  placeholder={filter.placeholder || filter.label}
                  value={currentValue}
                  onChange={(e) => onChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-gray-800"
                />
              </div>
            );
          })}

          {/* Active Filter Counter & Clear button */}
          {activeCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                <Filter className="w-3 h-3 mr-1" />
                {activeCount} active
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Right Action (e.g. Export, Add) */}
        {actionButton && <div className="shrink-0 flex items-center gap-2">{actionButton}</div>}
      </div>
    </div>
  );
};

export default FilterBar;
