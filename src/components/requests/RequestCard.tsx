import React from 'react';
import { ChevronUp, MessageSquare, Clock, ShieldCheck, Tag } from 'lucide-react';
import { FeatureRequest, FeatureStatus, UserRole } from '../../types/index.js';
import { useToggleVoteMutation } from '../../store/apiSlice.js';
import { useAppDispatch, useAppSelector } from '../../store/index.js';
import { openAuthModal } from '../../store/authSlice.js';

interface RequestCardProps {
  request: FeatureRequest;
  onSelect: (request: FeatureRequest) => void;
  onOpenAdminStatus?: (request: FeatureRequest) => void;
}

const statusColors: Record<FeatureStatus, { bg: string; text: string; border: string }> = {
  [FeatureStatus.SUBMITTED]: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  [FeatureStatus.UNDER_REVIEW]: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  [FeatureStatus.PLANNED]: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  [FeatureStatus.IN_PROGRESS]: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  [FeatureStatus.COMPLETED]: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  [FeatureStatus.REJECTED]: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
};

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onSelect,
  onOpenAdminStatus,
}) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isAdmin } = useAppSelector((state) => state.auth);
  const [toggleVote, { isLoading: isVoting }] = useToggleVoteMutation();

  const handleVoteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }

    try {
      await toggleVote({ requestId: request._id }).unwrap();
    } catch {
      // Error handled by RTK Query optimistic rollback
    }
  };

  const statusStyle = statusColors[request.status] || statusColors[FeatureStatus.SUBMITTED];

  const formattedDate = new Date(request.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      id={`request-card-${request._id}`}
      onClick={() => onSelect(request)}
      className="group bg-white rounded-xl border border-slate-200/90 hover:border-indigo-200 hover:shadow-md transition-all p-5 cursor-pointer flex flex-col sm:flex-row items-start gap-4 select-none"
    >
      {/* Upvote tactile button */}
      <button
        id={`btn-upvote-${request._id}`}
        type="button"
        disabled={isVoting}
        onClick={handleVoteClick}
        className={`shrink-0 w-full sm:w-13 sm:h-18 flex sm:flex-col items-center justify-center gap-1.5 py-2 sm:py-2.5 px-3 sm:px-1 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
          request.hasVoted
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
            : 'bg-slate-50 hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-600 border-slate-200/80 hover:border-indigo-300'
        }`}
      >
        <ChevronUp
          className={`w-5 h-5 transition-transform group-hover:-translate-y-0.5 ${
            request.hasVoted ? 'text-white stroke-[3]' : 'text-slate-400 group-hover:text-indigo-600'
          }`}
        />
        <span className="text-sm font-bold leading-none">{request.voteCount}</span>
        <span className="sm:hidden text-xs text-slate-500 font-normal">
          {request.hasVoted ? 'Voted' : 'Upvote'}
        </span>
      </button>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
          >
            {request.status.replace('_', ' ')}
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
            <Tag className="w-3 h-3 text-slate-400" />
            {request.category}
          </span>

          {isAdmin && onOpenAdminStatus && (
            <button
              id={`btn-admin-mod-${request._id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAdminStatus(request);
              }}
              className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors"
            >
              <ShieldCheck className="w-3 h-3 text-amber-600" />
              Manage Status
            </button>
          )}
        </div>

        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1.5">
          {request.title}
        </h3>

        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-3">
          {request.description}
        </p>

        {/* Metadata footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-[10px] font-bold text-slate-600">
              {request.author?.avatar ? (
                <img src={request.author.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                request.author?.name?.charAt(0) || 'U'
              )}
            </div>
            <span className="text-slate-600 font-medium">{request.author?.name || 'Community User'}</span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3" />
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{request.commentCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
