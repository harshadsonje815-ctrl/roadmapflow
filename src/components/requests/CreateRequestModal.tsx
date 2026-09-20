import React, { useState } from 'react';
import { X, Lightbulb, Loader2, AlertCircle } from 'lucide-react';
import { useCreateRequestMutation } from '../../store/apiSlice.js';
import { FeatureCategory } from '../../types/index.js';
import { useToast } from '../../hooks/useToast.js';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (requestId: string) => void;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(FeatureCategory.GENERAL);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const [createRequest, { isLoading }] = useCreateRequestMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long');
      return;
    }

    if (description.trim().length < 20) {
      setError('Description must be at least 20 characters to provide sufficient context');
      return;
    }

    try {
      const res = await createRequest({
        title: title.trim(),
        category,
        description: description.trim(),
      }).unwrap();

      setTitle('');
      setDescription('');
      toast.success('Feature proposal submitted successfully!');
      onClose();
      onCreated(res._id);
    } catch (err: any) {
      const errorMsg =
        err?.data?.error?.message ||
        err?.error ||
        'Failed to submit proposal. Please verify inputs.';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div
      id="create-request-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="create-request-modal"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Submit Feature Request</h2>
          </div>
          <button
            id="btn-close-create-modal"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Feature Title
            </label>
            <input
              id="input-create-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Export roadmap to CSV and PDF format"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              id="select-create-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              {Object.values(FeatureCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description & Use Case
            </label>
            <textarea
              id="textarea-create-desc"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem you are solving, the expected solution, and how this will benefit the community..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">Minimum 20 characters.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              id="btn-cancel-create"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-proposal"
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Post Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
