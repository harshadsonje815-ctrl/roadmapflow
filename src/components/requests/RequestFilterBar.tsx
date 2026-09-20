import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/index.js';
import {
  setSearch,
  setCategory,
  setStatus,
  setSort,
  resetFilters,
} from '../../store/filterSlice.js';
import { FeatureCategory, FeatureStatus } from '../../types/index.js';
import { useDebounce } from '../../hooks/useDebounce.js';

export const RequestFilterBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { search, category, status, sort } = useAppSelector((state) => state.filters);

  // Local state for instant keystroke feedback
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 300);

  // Sync debounced local input to Redux store
  useEffect(() => {
    if (debouncedSearch !== search) {
      dispatch(setSearch(debouncedSearch));
    }
  }, [debouncedSearch, dispatch, search]);

  // Sync back if Redux search is reset externally
  useEffect(() => {
    if (search !== localSearch && search === '') {
      setLocalSearch('');
    }
  }, [search]);

  const categories = ['ALL', ...Object.values(FeatureCategory)];
  const statuses = ['ALL', ...Object.values(FeatureStatus)];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-4">
      {/* Top row: Search input + Status + Sort */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="filter-search-input"
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search proposals, keywords, or topics..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50/60 hover:bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-50/60 border border-slate-200 rounded-lg px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              id="filter-status-select"
              value={status}
              onChange={(e) => dispatch(setStatus(e.target.value as any))}
              aria-label="Filter feature requests by status"
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              {statuses.filter((s) => s !== 'ALL').map((st) => (
                <option key={st} value={st}>
                  {st.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Sort order */}
          <div className="flex items-center gap-1.5 bg-slate-50/60 border border-slate-200 rounded-lg px-3 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              id="filter-sort-select"
              value={sort}
              onChange={(e) => dispatch(setSort(e.target.value as any))}
              aria-label="Sort feature requests by"
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="upvotes">Most Upvoted</option>
              <option value="recent">Most Recent</option>
              <option value="trending">Trending</option>
              <option value="comments">Most Discussed</option>
            </select>
          </div>

          {(search || category !== 'ALL' || status !== 'ALL' || sort !== 'upvotes') && (
            <button
              id="btn-reset-filters"
              onClick={() => dispatch(resetFilters())}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-medium text-slate-400 mr-1 shrink-0">Category:</span>
        {categories.map((cat) => {
          const isSelected = category === cat;
          return (
            <button
              key={cat}
              id={`category-pill-${cat}`}
              onClick={() => dispatch(setCategory(cat as any))}
              className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};
