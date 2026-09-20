import { useAppDispatch } from '../store/index.js';
import { addToast, removeToast, clearToasts, ToastType } from '../store/toastSlice.js';

export function useToast() {
  const dispatch = useAppDispatch();

  const showToast = (message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
    dispatch(addToast({ message, type, title, duration }));
  };

  const toastMethods = {
    success: (message: string, title?: string, duration?: number) =>
      showToast(message, 'success', title, duration),
    error: (message: string, title?: string, duration?: number) =>
      showToast(message, 'error', title, duration),
    warning: (message: string, title?: string, duration?: number) =>
      showToast(message, 'warning', title, duration),
    info: (message: string, title?: string, duration?: number) =>
      showToast(message, 'info', title, duration),
  };

  return {
    ...toastMethods,
    toast: toastMethods,
    removeToast: (id: string) => dispatch(removeToast(id)),
    clearToasts: () => dispatch(clearToasts()),
  };
}

export default useToast;
