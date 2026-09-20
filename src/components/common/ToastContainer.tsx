import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/index.js';
import { removeToast, ToastItem } from '../../store/toastSlice.js';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastComponent: React.FC<{ item: ToastItem }> = ({ item }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (item.duration && item.duration > 0) {
      const timer = setTimeout(() => {
        dispatch(removeToast(item.id));
      }, item.duration);
      return () => clearTimeout(timer);
    }
  }, [item, dispatch]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />,
  };

  const borders = {
    success: 'border-emerald-200 bg-white shadow-emerald-900/5',
    error: 'border-rose-200 bg-white shadow-rose-900/5',
    warning: 'border-amber-200 bg-white shadow-amber-900/5',
    info: 'border-indigo-200 bg-white shadow-indigo-900/5',
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${borders[item.type]}`}
    >
      {icons[item.type]}
      <div className="flex-1 min-w-0 pr-2">
        {item.title && (
          <h4 className="text-xs font-bold text-slate-900 mb-0.5">{item.title}</h4>
        )}
        <p className="text-xs text-slate-600 leading-relaxed break-words">{item.message}</p>
      </div>
      <button
        type="button"
        onClick={() => dispatch(removeToast(item.id))}
        aria-label="Close notification"
        className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useAppSelector((state) => state.toast.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"
    >
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <ToastComponent item={item} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
