import React, { useState } from 'react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';
import { FeatureRequest, FeatureStatus } from '../../types/index.js';
import { useUpdateStatusMutation } from '../../store/apiSlice.js';
import { useToast } from '../../hooks/useToast.js';

interface AdminStatusModalProps {
  request: FeatureRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminStatusModal: React.FC<AdminStatusModalProps> = ({
  request,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !request) return null;

  const toast = useToast();
  const [status, setStatus] = useState<FeatureStatus>(request.status);
  const [roadmapOrder, setRoadmapOrder] = useState<number>(request.roadmapOrder || 0);
  const [updateStatus, { isLoading }] = useUpdateStatusMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStatus({
        id: request._id,
        status,
        roadmapOrder: Number(roadmapOrder),
      }).unwrap();
      toast.success(`Updated status to ${status.replace('_', ' ')}`);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div
      id="admin-status-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="admin-status-modal"
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Admin: Update Lifecycle Status</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <span className="text-xs text-slate-400 font-medium block mb-1">Target Feature:</span>
            <p className="text-sm font-semibold text-slate-800 line-clamp-1">{request.title}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Roadmap Status
            </label>
            <select
              id="select-admin-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as FeatureStatus)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              {Object.values(FeatureStatus).map((st) => (
                <option key={st} value={st}>
                  {st.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Roadmap Sequence Priority
            </label>
            <input
              id="input-admin-order"
              type="number"
              value={roadmapOrder}
              onChange={(e) => setRoadmapOrder(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Lower numbers appear higher in the Kanban column.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-status-update"
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
