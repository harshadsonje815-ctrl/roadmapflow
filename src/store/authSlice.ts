import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole } from '../types/index.js';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isAdmin: false,
  authModalOpen: false,
  authModalMode: 'login',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isAdmin = action.payload.user.role === UserRole.ADMIN;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    logOut: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
    },
    openAuthModal: (state, action: PayloadAction<'login' | 'register' | undefined>) => {
      state.authModalOpen = true;
      state.authModalMode = action.payload || 'login';
    },
    closeAuthModal: (state) => {
      state.authModalOpen = false;
    },
  },
});

export const { setCredentials, setAccessToken, logOut, openAuthModal, closeAuthModal } =
  authSlice.actions;

export default authSlice.reducer;
