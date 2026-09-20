import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './store/index.js';
import { Navbar } from './components/layout/Navbar.js';
import { RequestFilterBar } from './components/requests/RequestFilterBar.js';
import { RequestCard } from './components/requests/RequestCard.js';
import { RequestDetailView } from './components/requests/RequestDetailView.js';
import { CreateRequestModal } from './components/requests/CreateRequestModal.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { AdminStatusModal } from './components/admin/AdminStatusModal.js';
import { KanbanBoard } from './components/roadmap/KanbanBoard.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { useGetRequestsQuery } from './store/apiSlice.js';
import { setPage, resetFilters } from './store/filterSlice.js';
import { openAuthModal } from './store/authSlice.js';
import { FeatureRequest } from './types/index.js';
import { Plus } from 'lucide-react';
import { RequestCardListSkeleton } from './components/common/LoadingSkeleton.js';
import { EmptyState } from './components/common/EmptyState.js';
import { Pagination } from './components/common/Pagination.js';
import { ToastContainer } from './components/common/ToastContainer.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

function PortalContent() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const filters = useAppSelector((state) => state.filters);

  const [currentView, setCurrentView] = useState<'feed' | 'roadmap' | 'admin'>('feed');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [adminTargetRequest, setAdminTargetRequest] = useState<FeatureRequest | null>(null);

  // Fetch paginated requests with current active filters
  const { data: requestData, isLoading } = useGetRequestsQuery({
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    category: filters.category !== 'ALL' ? filters.category : undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    sort: filters.sort,
  });

  const handleOpenCreate = () => {
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
    } else {
      setIsCreateOpen(true);
    }
  };

  const handleSelectRequest = (req: FeatureRequest) => {
    setSelectedRequestId(req._id);
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.category !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.sort !== 'upvotes';

  if (currentView === 'admin') {
    return (
      <AdminDashboardPage
        onNavigate={(view) => {
          if (view === 'feed' || view === 'roadmap') {
            setCurrentView(view);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col text-slate-900 font-sans antialiased">
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          setSelectedRequestId(null);
        }}
        onOpenCreate={handleOpenCreate}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedRequestId ? (
          /* Request Detail View */
          <RequestDetailView
            requestId={selectedRequestId}
            onBack={() => setSelectedRequestId(null)}
            onOpenAdminStatus={(req) => setAdminTargetRequest(req)}
          />
        ) : currentView === 'roadmap' ? (
          /* Public Kanban Roadmap View */
          <KanbanBoard
            onSelectRequest={handleSelectRequest}
            onOpenAdminStatus={(req) => setAdminTargetRequest(req)}
          />
        ) : (
          /* Feature Requests Feed View */
          <div className="space-y-6">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Feature Requests & Ideas
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Suggest ideas, vote on community proposals, and shape the future of the platform.
                </p>
              </div>

              <button
                id="btn-feed-submit-request"
                onClick={handleOpenCreate}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Feature Request</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <RequestFilterBar />

            {/* Feed List */}
            {isLoading ? (
              <RequestCardListSkeleton count={4} />
            ) : !requestData?.docs || requestData.docs.length === 0 ? (
              <EmptyState
                variant={hasActiveFilters ? 'no-results' : 'no-requests'}
                actionLabel="Submit First Proposal"
                onAction={handleOpenCreate}
                secondaryActionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
                onSecondaryAction={hasActiveFilters ? () => dispatch(resetFilters()) : undefined}
              />
            ) : (
              <div className="space-y-3.5">
                {requestData.docs.map((req) => (
                  <RequestCard
                    key={req._id}
                    request={req}
                    onSelect={handleSelectRequest}
                    onOpenAdminStatus={(target) => setAdminTargetRequest(target)}
                  />
                ))}

                {/* Pagination Component */}
                {requestData.meta && (
                  <Pagination
                    page={requestData.meta.page}
                    totalPages={requestData.meta.totalPages}
                    totalItems={requestData.meta.total}
                    pageSize={filters.limit}
                    onPageChange={(newPage) => dispatch(setPage(newPage))}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Modals */}
      <CreateRequestModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(id) => {
          setSelectedRequestId(id);
        }}
      />

      <AuthModal />

      <AdminStatusModal
        request={adminTargetRequest}
        isOpen={!!adminTargetRequest}
        onClose={() => setAdminTargetRequest(null)}
      />

      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-16 text-center text-xs text-slate-500">
        <p>© 2026 RoadmapFlow Portal. All rights reserved. MERN Stack Architecture.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <PortalContent />
      </ErrorBoundary>
    </Provider>
  );
}
