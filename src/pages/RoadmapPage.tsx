import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar.js';
import { KanbanBoard } from '../components/roadmap/KanbanBoard.js';
import { RequestDetailView } from '../components/requests/RequestDetailView.js';
import { CreateRequestModal } from '../components/requests/CreateRequestModal.js';
import { AuthModal } from '../components/auth/AuthModal.js';
import { AdminStatusModal } from '../components/admin/AdminStatusModal.js';
import { useAppDispatch, useAppSelector } from '../store/index.js';
import { openAuthModal } from '../store/authSlice.js';
import { FeatureRequest } from '../types/index.js';
import { ToastContainer } from '../components/common/ToastContainer.js';
import { ErrorBoundary } from '../components/common/ErrorBoundary.js';

interface RoadmapPageProps {
  onNavigate?: (view: 'feed' | 'roadmap' | 'admin' | 'login' | 'register') => void;
}

export const RoadmapPage: React.FC<RoadmapPageProps> = ({ onNavigate }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [adminTargetRequest, setAdminTargetRequest] = useState<FeatureRequest | null>(null);

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

  const handleViewChange = (view: 'feed' | 'roadmap' | 'admin') => {
    setSelectedRequestId(null);
    if (onNavigate) {
      onNavigate(view);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50/60 flex flex-col text-slate-900 font-sans antialiased">
        {/* Primary Navigation */}
        <Navbar
          currentView="roadmap"
          onViewChange={handleViewChange}
          onOpenCreate={handleOpenCreate}
        />

        {/* Main Roadmap Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {selectedRequestId ? (
            /* Request Detail View */
            <RequestDetailView
              requestId={selectedRequestId}
              onBack={() => setSelectedRequestId(null)}
              onOpenAdminStatus={(req) => setAdminTargetRequest(req)}
            />
          ) : (
            /* Public Kanban Roadmap View */
            <KanbanBoard
              onSelectRequest={handleSelectRequest}
              onOpenAdminStatus={(req) => setAdminTargetRequest(req)}
            />
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

        <ToastContainer />

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-6 mt-16 text-center text-xs text-slate-500">
          <p>© 2026 RoadmapFlow Portal. All rights reserved. MERN Stack Architecture.</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default RoadmapPage;
