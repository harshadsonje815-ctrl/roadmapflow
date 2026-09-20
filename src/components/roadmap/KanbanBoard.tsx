import React from 'react';
import { Kanban, ChevronUp, MessageSquare, Tag, ShieldCheck } from 'lucide-react';
import { useGetRoadmapQuery, useToggleVoteMutation } from '../../store/apiSlice.js';
import { FeatureRequest, FeatureStatus } from '../../types/index.js';
import { useAppDispatch, useAppSelector } from '../../store/index.js';
import { openAuthModal } from '../../store/authSlice.js';
import { KanbanColumnSkeleton } from '../common/LoadingSkeleton.js';
import { EmptyState } from '../common/EmptyState.js';
import { useToast } from '../../hooks/useToast.js';

interface KanbanBoardProps {
  onSelectRequest: (request: FeatureRequest) => void;
  onOpenAdminStatus: (request: FeatureRequest) => void;
}

const columnMeta: Record<
  FeatureStatus,
  { label: string; dotColor: string; headerBg: string; borderColor: string }
> = {
  [FeatureStatus.UNDER_REVIEW]: {
    label: 'Under Review',
    dotColor: 'bg-amber-400',
    headerBg: 'bg-amber-500/10 text-amber-900',
    borderColor: 'border-amber-200',
  },
  [FeatureStatus.PLANNED]: {
    label: 'Planned',
    dotColor: 'bg-blue-500',
    headerBg: 'bg-blue-500/10 text-blue-900',
    borderColor: 'border-blue-200',
  },
  [FeatureStatus.IN_PROGRESS]: {
    label: 'In Progress',
    dotColor: 'bg-purple-500',
    headerBg: 'bg-purple-500/10 text-purple-900',
    borderColor: 'border-purple-200',
  },
  [FeatureStatus.COMPLETED]: {
    label: 'Completed',
    dotColor: 'bg-emerald-500',
    headerBg: 'bg-emerald-500/10 text-emerald-900',
    borderColor: 'border-emerald-200',
  },
  [FeatureStatus.SUBMITTED]: {
    label: 'Submitted',
    dotColor: 'bg-slate-400',
    headerBg: 'bg-slate-100 text-slate-800',
    borderColor: 'border-slate-200',
  },
  [FeatureStatus.REJECTED]: {
    label: 'Rejected',
    dotColor: 'bg-rose-400',
    headerBg: 'bg-rose-100 text-rose-800',
    borderColor: 'border-rose-200',
  },
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onSelectRequest,
  onOpenAdminStatus,
}) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isAdmin } = useAppSelector((state) => state.auth);
  const { data: columns = [], isLoading, refetch } = useGetRoadmapQuery();
  const [toggleVote] = useToggleVoteMutation();

  const handleVote = async (e: React.MouseEvent, reqId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }
    try {
      await toggleVote({ requestId: reqId }).unwrap();
    } catch {
      // Handled by RTK
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-96 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Roadmap Intro banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Kanban className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">Public Product Roadmap</h1>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl">
            Track real-time engineering progress on features requested and voted on by the community.
            Proposals are prioritized based on popularity and strategic alignment.
          </p>
        </div>
        <button
          id="btn-refresh-roadmap"
          onClick={() => refetch()}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          Refresh Board
        </button>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {columns.map((column) => {
          const meta = columnMeta[column.status] || columnMeta[FeatureStatus.UNDER_REVIEW];

          return (
            <div
              key={column.status}
              id={`kanban-col-${column.status}`}
              className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3.5 min-h-[500px] flex flex-col gap-3"
            >
              {/* Column Header */}
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-xl border ${meta.headerBg} ${meta.borderColor}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${meta.dotColor}`} />
                  <h3 className="font-bold text-xs uppercase tracking-wider">{column.title}</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 shadow-2xs">
                  {column.items?.length || 0}
                </span>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-0.5">
                {(!column.items || column.items.length === 0) && (
                  <EmptyState
                    variant="no-roadmap"
                    title={`No ${column.title.toLowerCase()} items`}
                    description="Proposals will advance here as they get prioritized."
                    className="p-6 my-2 bg-white/70 shadow-none border-slate-200"
                  />
                )}

                {column.items?.map((item) => (
                  <div
                    key={item._id}
                    id={`roadmap-card-${item._id}`}
                    onClick={() => onSelectRequest(item)}
                    className="bg-white rounded-xl border border-slate-200/90 hover:border-indigo-300 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                        <Tag className="w-2.5 h-2.5" />
                        {item.category}
                      </span>

                      {isAdmin && (
                        <button
                          id={`btn-kanban-mod-${item._id}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAdminStatus(item);
                          }}
                          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 rounded border border-amber-300 transition-opacity"
                        >
                          <ShieldCheck className="w-3 h-3 text-amber-600" />
                          Move
                        </button>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1.5">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                      <button
                        id={`btn-kanban-vote-${item._id}`}
                        type="button"
                        onClick={(e) => handleVote(e, item._id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold transition-all ${
                          item.hasVoted
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-200'
                        }`}
                      >
                        <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{item.voteCount}</span>
                      </button>

                      <div className="flex items-center gap-1 text-slate-500 font-medium">
                        <MessageSquare className="w-3 h-3" />
                        <span>{item.commentCount || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
