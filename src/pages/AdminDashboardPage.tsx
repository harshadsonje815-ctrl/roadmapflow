import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar.js';
import { AuthModal } from '../components/auth/AuthModal.js';
import { AdminStatusModal } from '../components/admin/AdminStatusModal.js';
import { CreateRequestModal } from '../components/requests/CreateRequestModal.js';
import {
  useGetRequestsQuery,
  useUpdateStatusMutation,
  useDeleteRequestMutation,
  useLoginMutation,
} from '../store/apiSlice.js';
import { useAppDispatch, useAppSelector } from '../store/index.js';
import { setCredentials, openAuthModal } from '../store/authSlice.js';
import { FeatureRequest, FeatureStatus, FeatureCategory } from '../types/index.js';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Layers,
  Loader2,
} from 'lucide-react';
import { TableSkeleton } from '../components/common/LoadingSkeleton.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Pagination } from '../components/common/Pagination.js';
import { ToastContainer } from '../components/common/ToastContainer.js';
import { useToast } from '../hooks/useToast.js';

interface AdminDashboardPageProps {
  onNavigate?: (view: 'feed' | 'roadmap' | 'admin' | 'login' | 'register') => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isAdmin, user } = useAppSelector((state) => state.auth);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [adminTargetRequest, setAdminTargetRequest] = useState<FeatureRequest | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);

  const { data: requestData, isLoading, refetch } = useGetRequestsQuery({
    page,
    limit: 15,
    search: search || undefined,
    status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
    category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
    sort: 'recent',
  });

  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateStatusMutation();
  const [deleteRequest, { isLoading: isDeleting }] = useDeleteRequestMutation();
  const [login] = useLoginMutation();

  const handleQuickAdminLogin = async () => {
    try {
      setQuickLoginLoading(true);
      const res = await login({ email: 'admin@portal.dev', password: 'admin123' }).unwrap();
      dispatch(setCredentials(res));
      toast.success('Signed in as administrator');
    } catch {
      toast.error('Could not authenticate automatically. Please use the login form.');
      dispatch(openAuthModal('login'));
    } finally {
      setQuickLoginLoading(false);
    }
  };

  const handleInlineStatusChange = async (requestId: string, newStatus: FeatureStatus) => {
    try {
      await updateStatus({
        id: requestId,
        status: newStatus,
      }).unwrap();
      toast.success(`Lifecycle status changed to ${newStatus.replace('_', ' ')}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (requestId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete proposal "${title}"? This action cannot be undone.`)) {
      try {
        await deleteRequest(requestId).unwrap();
        toast.success(`Deleted proposal: "${title}"`);
        refetch();
      } catch (err: any) {
        toast.error(err?.data?.message || 'Failed to delete proposal');
      }
    }
  };

  // If not authenticated or not admin, show graceful guard
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased">
        <Navbar
          currentView="feed"
          onViewChange={(view) => onNavigate && onNavigate(view)}
          onOpenCreate={() => dispatch(openAuthModal('login'))}
        />

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">Admin Privileges Required</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                You must be logged in as an administrator to access product management controls, status transitions, and user moderation.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                id="btn-admin-auto-login"
                type="button"
                disabled={quickLoginLoading}
                onClick={handleQuickAdminLogin}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {quickLoginLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                )}
                <span>Sign In as Demo Admin (Alex Chen)</span>
              </button>

              <button
                id="btn-admin-open-modal"
                type="button"
                onClick={() => dispatch(openAuthModal('login'))}
                className="w-full py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Enter Different Account Credentials
              </button>
            </div>
          </div>
        </main>

        <AuthModal />
      </div>
    );
  }

  // Calculate metrics
  const docs = requestData?.docs || [];
  const totalCount = requestData?.meta?.total || 0;
  const underReviewCount = docs.filter((d) => d.status === FeatureStatus.UNDER_REVIEW).length;
  const inProgressCount = docs.filter(
    (d) => d.status === FeatureStatus.IN_PROGRESS || d.status === FeatureStatus.PLANNED
  ).length;
  const completedCount = docs.filter((d) => d.status === FeatureStatus.COMPLETED).length;

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col text-slate-900 font-sans antialiased">
      <Navbar
        currentView="admin"
        onViewChange={(view) => onNavigate && onNavigate(view)}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Admin Control Center</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Logged in as <span className="font-semibold text-slate-700">{user?.name}</span> ({user?.email}). Manage lifecycle stages and content moderation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-admin-new-request"
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Post Admin Proposal</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Total Proposals</span>
              <Layers className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Under Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-800">{underReviewCount}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Planned / In Progress</span>
              <BarChart3 className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-800">{inProgressCount}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-800">{completedCount}</div>
          </div>
        </div>

        {/* Filter and Search Bar for Admin */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="admin-search-input"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by proposal title, author, or keywords..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="admin-status-filter"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                {Object.values(FeatureStatus).map((st) => (
                  <option key={st} value={st}>
                    {st.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <select
                id="admin-category-filter"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {Object.values(FeatureCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Requests Management Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Manage Feature Lifecycle Stages</h2>
            <span className="text-xs text-slate-400">{docs.length} items shown</span>
          </div>

          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : docs.length === 0 ? (
            <div className="p-6">
              <EmptyState
                variant="no-results"
                title="No proposals found"
                description="No feature proposals matched your current administrative search or status filters."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Feature Proposal</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">Engagement</th>
                    <th className="py-3 px-4">Lifecycle Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docs.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs">
                        <span className="block truncate font-semibold">{req.title}</span>
                        <span className="block truncate text-[11px] text-slate-400">{req.description}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {req.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block font-medium text-slate-800">{req.author?.name || 'User'}</span>
                        <span className="block text-[10px] text-slate-400">{req.author?.email}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800">{req.voteCount}</span> votes •{' '}
                        <span>{req.commentCount || 0}</span> comments
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          id={`select-status-${req._id}`}
                          aria-label={`Change status for ${req.title}`}
                          value={req.status}
                          disabled={isUpdatingStatus}
                          onChange={(e) => handleInlineStatusChange(req._id, e.target.value as FeatureStatus)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          {Object.values(FeatureStatus).map((st) => (
                            <option key={st} value={st}>
                              {st.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-admin-order-${req._id}`}
                            title="Detailed Lifecycle Modal"
                            type="button"
                            onClick={() => setAdminTargetRequest(req)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-admin-delete-${req._id}`}
                            title="Delete Proposal"
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(req._id, req.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {requestData?.meta && (
            <div className="px-6 py-4 border-t border-slate-100">
              <Pagination
                page={requestData.meta.page}
                totalPages={requestData.meta.totalPages}
                totalItems={requestData.meta.total}
                pageSize={15}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Global Modals */}
      <CreateRequestModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => refetch()}
      />

      <AdminStatusModal
        request={adminTargetRequest}
        isOpen={!!adminTargetRequest}
        onClose={() => {
          setAdminTargetRequest(null);
          refetch();
        }}
      />

      <AuthModal />

      <ToastContainer />
    </div>
  );
};

export default AdminDashboardPage;
