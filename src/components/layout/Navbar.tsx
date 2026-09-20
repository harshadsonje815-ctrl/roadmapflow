import React from 'react';
import { Layers, Plus, Kanban, MessageSquare, LogIn, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/index.js';
import { openAuthModal, logOut } from '../../store/authSlice.js';
import { useLogoutMutation } from '../../store/apiSlice.js';
import { UserRole } from '../../types/index.js';

interface NavbarProps {
  currentView: 'feed' | 'roadmap' | 'admin';
  onViewChange: (view: 'feed' | 'roadmap' | 'admin') => void;
  onOpenCreate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onOpenCreate,
}) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isAdmin } = useAppSelector((state) => state.auth);
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Ignore
    } finally {
      dispatch(logOut());
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <div
            id="brand-logo-btn"
            onClick={() => onViewChange('feed')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                RoadmapFlow
              </span>
              <span className="text-[11px] font-medium tracking-wide uppercase text-indigo-600 block">
                Feature Portal
              </span>
            </div>
          </div>

          {/* Primary View Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-lg border border-slate-200/60">
            <button
              id="nav-feed-tab"
              onClick={() => onViewChange('feed')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                currentView === 'feed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Feature Requests</span>
            </button>
            <button
              id="nav-roadmap-tab"
              onClick={() => onViewChange('roadmap')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                currentView === 'roadmap'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Public Roadmap</span>
            </button>
            {isAdmin && (
              <button
                id="nav-admin-tab"
                onClick={() => onViewChange('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-amber-100 text-amber-900 shadow-xs'
                    : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            id="btn-submit-request-navbar"
            onClick={() => {
              if (!isAuthenticated) {
                dispatch(openAuthModal('login'));
              } else {
                onOpenCreate();
              }
            }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Submit Request</span>
            <span className="sm:hidden">Request</span>
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 text-xs font-semibold overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-800 block max-w-[110px] truncate">
                      {user.name}
                    </span>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-amber-100 text-amber-800 rounded border border-amber-200">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>
              </div>

              <button
                id="btn-logout"
                title="Sign out"
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="btn-login-trigger"
                onClick={() => dispatch(openAuthModal('login'))}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                id="btn-register-trigger"
                onClick={() => dispatch(openAuthModal('register'))}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
