import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FeatureCategory, FeatureStatus } from '../types/index.js';

interface FilterState {
  search: string;
  category: FeatureCategory | 'ALL';
  status: FeatureStatus | 'ALL';
  sort: 'upvotes' | 'recent' | 'trending' | 'comments';
  page: number;
  limit: number;
}

const initialState: FilterState = {
  search: '',
  category: 'ALL',
  status: 'ALL',
  sort: 'upvotes',
  page: 1,
  limit: 10,
};

export const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.page = 1;
    },
    setCategory: (state, action: PayloadAction<FeatureCategory | 'ALL'>) => {
      state.category = action.payload;
      state.page = 1;
    },
    setStatus: (state, action: PayloadAction<FeatureStatus | 'ALL'>) => {
      state.status = action.payload;
      state.page = 1;
    },
    setSort: (state, action: PayloadAction<'upvotes' | 'recent' | 'trending' | 'comments'>) => {
      state.sort = action.payload;
      state.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    resetFilters: (state) => {
      state.search = '';
      state.category = 'ALL';
      state.status = 'ALL';
      state.sort = 'upvotes';
      state.page = 1;
    },
  },
});

export const { setSearch, setCategory, setStatus, setSort, setPage, resetFilters } =
  filterSlice.actions;

export default filterSlice.reducer;
