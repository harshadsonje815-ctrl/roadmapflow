import React from 'react';
import { ArrowLeft, ChevronUp, Clock, Tag, ShieldCheck, User as UserIcon } from 'lucide-react';
import { FeatureRequest, FeatureStatus } from '../../types/index.js';
import { useGetRequestQuery, useToggleVoteMutation } from '../../store/apiSlice.js';
import { CommentSection } from '../comments/CommentSection.js';
import { useAppDispatch, useAppSelector } from '../../store/index.js';
import { openAuthModal } from '../../store/authSlice.js';
import { RequestDetailSkeleton } from '../common/LoadingSkeleton.js';
import { EmptyState } from '../common/EmptyState.js';
import { useToast } from '../../hooks/useToast.js';

interface RequestDetailViewProps {
  requestId: string;
  onBack: () => void;
  onOpenAdminStatus: (request: FeatureRequest) => void;
}

const statusColors: Record<FeatureStatus, { bg: string; text: string; border: string }> = {
  [FeatureStatus.SUBMITTED]: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  [FeatureStatus.UNDER_REVIEW]: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  [FeatureStatus.PLANNED]: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  [FeatureStatus.IN_PROGRESS]: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  [FeatureStatus.COMPLETED]: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  [FeatureStatus.REJECTED]: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
};

export const RequestDetailView: React.FC<RequestDetailViewProps> = ({
  requestId,
  onBack,
  onOpenAdminStatus,
}) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isAdmin } = useAppSelector((state) => state.auth);
  const toast = useToast();

  const { data: request, isLoading } = useGetRequestQuery(requestId);
  const [toggleVote, { isLoading: isVoting }] = useToggleVoteMutation();

  const handleVote = async () => {
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }
    try {
      await toggleVote({ requestId }).unwrap();
      toast.info(request?.hasVoted ? 'Vote withdrawn' : 'Vote recorded! Thank you for your feedback.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to record vote');
    }
  };

  if (isLoading) {
    return <RequestDetailSkeleton />;
  }

  if (!request) {
    return (
      <EmptyState
        variant="no-results"
        title="Feature Proposal Not Found"
        description="The proposal you are looking for does not exist or may have been deleted."
        actionLabel="Back to All Proposals"
        onAction={onBack}
      />
    );
  }

  const statusStyle = statusColors[request.status] || statusColors[FeatureStatus.SUBMITTED];
  const formattedDate = new Date(request.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        id="btn-back-to-feed"
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Proposals</span>
      </button>

      {/* Main Detail Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Large Upvote Widget */}
          <button
            id={`btn-detail-upvote-${request._id}`}
            type="button"
            disabled={isVoting}
            onClick={handleVote}
            className={`w-full sm:w-16 sm:h-22 flex sm:flex-col items-center justify-center gap-1 py-3 px-4 sm:px-2 rounded-2xl border font-bold text-sm transition-all cursor-pointer ${
              request.hasVoted
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-200'
            }`}
          >
            <ChevronUp className={`w-6 h-6 ${request.hasVoted ? 'stroke-[3]' : 'text-slate-400'}`} />
            <span className="text-base font-extrabold">{request.voteCount}</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
              {request.hasVoted ? 'Voted' : 'Vote'}
            </span>
          </button>

          {/* Core Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                {request.status.replace('_', ' ')}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {request.category}
              </span>

              {isAdmin && (
                <button
                  id="btn-detail-admin-manage"
                  type="button"
                  onClick={() => onOpenAdminStatus(request)}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Admin Controls
                </button>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-4">
              {request.title}
            </h1>

            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap mb-6 text-sm sm:text-base">
              {request.description}
            </div>

            {/* Author Profile footer */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700">
                {request.author?.avatar ? (
                  <img src={request.author.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{request.author?.name?.charAt(0) || <UserIcon className="w-4 h-4" />}</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">{request.author?.name}</span>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>Submitted on {formattedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Threaded Discussion Section */}
        <CommentSection requestId={request._id} />
      </div>
    </div>
  );
};
