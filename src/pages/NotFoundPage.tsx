import React from 'react';
import { ArrowLeft, Compass, Layers, Plus, Home } from 'lucide-react';

interface NotFoundPageProps {
  onNavigateHome?: () => void;
  onNavigateRoadmap?: () => void;
  onOpenCreate?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateHome,
  onNavigateRoadmap,
  onOpenCreate,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-slate-900 font-sans antialiased">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <Compass className="w-8 h-8 animate-spin-slow stroke-[1.75]" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-extrabold text-indigo-600 tracking-tight">404</span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            The proposal, discussion, or screen you are looking for doesn’t exist or may have been moved.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            id="btn-404-home"
            type="button"
            onClick={onNavigateHome}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Feature Requests</span>
          </button>

          {onNavigateRoadmap && (
            <button
              id="btn-404-roadmap"
              type="button"
              onClick={onNavigateRoadmap}
              className="w-full py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Explore Public Roadmap</span>
            </button>
          )}

          {onOpenCreate && (
            <button
              id="btn-404-create"
              type="button"
              onClick={onOpenCreate}
              className="w-full py-2 px-4 border border-indigo-100 hover:bg-indigo-50/70 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New Proposal</span>
            </button>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go back to previous page</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
