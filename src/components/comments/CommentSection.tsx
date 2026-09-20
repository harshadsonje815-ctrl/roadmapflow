import React, { useState } from 'react';
import {
  MessageSquare,
  CornerDownRight,
  Trash2,
  Send,
  Loader2,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { CommentNode, UserRole } from '../../types/index.js';
import {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
} from '../../store/apiSlice.js';
import { useAppDispatch, useAppSelector } from '../../store/index.js';
import { openAuthModal } from '../../store/authSlice.js';
import { EmptyState } from '../common/EmptyState.js';
import { Skeleton } from '../common/LoadingSkeleton.js';
import { useToast } from '../../hooks/useToast.js';

interface CommentSectionProps {
  requestId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ requestId }) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isAdmin } = useAppSelector((state) => state.auth);
  const toast = useToast();

  const { data: comments = [], isLoading } = useGetCommentsQuery(requestId);
  const [createComment, { isLoading: isSubmitting }] = useCreateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const [topContent, setTopContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handlePostTopComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }

    if (!topContent.trim()) return;

    try {
      await createComment({
        requestId,
        content: topContent.trim(),
        parentComment: null,
      }).unwrap();
      setTopContent('');
      toast.success('Comment posted successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to post comment');
    }
  };

  const handlePostReply = async (parentCommentId: string) => {
    if (!isAuthenticated) {
      dispatch(openAuthModal('login'));
      return;
    }

    if (!replyContent.trim()) return;

    try {
      await createComment({
        requestId,
        content: replyContent.trim(),
        parentComment: parentCommentId,
      }).unwrap();
      setReplyContent('');
      setReplyingToId(null);
      toast.success('Reply submitted');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit reply');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('Are you sure you want to remove this comment?')) {
      try {
        await deleteComment({ commentId, requestId }).unwrap();
        toast.info('Comment removed');
      } catch (err: any) {
        toast.error(err?.data?.message || 'Failed to remove comment');
      }
    }
  };

  // Recursive comment node renderer
  const renderComment = (node: CommentNode) => {
    const isAuthor = user?._id === node.author?._id;
    const canDelete = !node.isDeleted && (isAuthor || isAdmin);
    const formattedDate = new Date(node.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div key={node._id} className="relative group/node text-sm">
        <div
          className={`p-3.5 rounded-xl transition-all ${
            node.isDeleted
              ? 'bg-slate-50/60 border border-dashed border-slate-200 text-slate-400 italic'
              : 'bg-white border border-slate-200/80 shadow-xs'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden">
                {node.author?.avatar ? (
                  <img src={node.author.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{node.author?.name?.charAt(0) || <UserIcon className="w-3 h-3" />}</span>
                )}
              </div>
              <span className="font-semibold text-xs text-slate-800">
                {node.author?.name || 'Community Member'}
              </span>
              {node.author?.role === UserRole.ADMIN && (
                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 rounded border border-amber-200">
                  <ShieldCheck className="w-2.5 h-2.5" /> Admin
                </span>
              )}
              <span className="text-[11px] text-slate-400">{formattedDate}</span>
            </div>

            {canDelete && (
              <button
                id={`btn-delete-comment-${node._id}`}
                onClick={() => handleDelete(node._id)}
                title="Delete comment"
                className="opacity-0 group-hover/node:opacity-100 text-slate-400 hover:text-red-600 transition-all p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Body */}
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{node.content}</p>

          {/* Reply trigger */}
          {!node.isDeleted && (
            <div className="mt-2 pt-1 flex items-center gap-3">
              <button
                id={`btn-reply-toggle-${node._id}`}
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    dispatch(openAuthModal('login'));
                    return;
                  }
                  if (replyingToId === node._id) {
                    setReplyingToId(null);
                  } else {
                    setReplyingToId(node._id);
                    setReplyContent('');
                  }
                }}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <CornerDownRight className="w-3 h-3" />
                <span>{replyingToId === node._id ? 'Cancel Reply' : 'Reply'}</span>
              </button>
            </div>
          )}

          {/* Inline Reply Box */}
          {replyingToId === node._id && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-start gap-2">
                <textarea
                  id={`input-reply-${node._id}`}
                  rows={2}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Replying to ${node.author?.name || 'comment'}...`}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <button
                  id={`btn-send-reply-${node._id}`}
                  type="button"
                  onClick={() => handlePostReply(node._id)}
                  disabled={!replyContent.trim()}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50 transition-colors shrink-0"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recursive child replies with tree indent guide */}
        {node.replies && node.replies.length > 0 && (
          <div className="ml-4 sm:ml-6 pl-3 border-l-2 border-slate-200/80 space-y-2.5 mt-2.5">
            {node.replies.map((child) => renderComment(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Discussion Thread</h3>
        </div>
        <span className="text-xs font-medium text-slate-500">
          {comments.length} top-level thread{comments.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Top Level Comment Input Box */}
      <form onSubmit={handlePostTopComment} className="mb-6">
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600 transition-all">
          <textarea
            id="input-top-comment"
            rows={3}
            value={topContent}
            onChange={(e) => setTopContent(e.target.value)}
            placeholder={
              isAuthenticated
                ? 'Share your thoughts, use cases, or feedback on this proposal...'
                : 'Sign in to join the conversation and leave a comment...'
            }
            onClick={() => {
              if (!isAuthenticated) dispatch(openAuthModal('login'));
            }}
            className="w-full text-sm text-slate-900 focus:outline-hidden placeholder:text-slate-400 resize-none"
          />
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
            <span className="text-[11px] text-slate-400">Markdown supported</span>
            <button
              id="btn-submit-top-comment"
              type="submit"
              disabled={isSubmitting || !topContent.trim()}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Comment</span>
            </button>
          </div>
        </div>
      </form>

      {/* Comment List */}
      {isLoading ? (
        <div className="space-y-4 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
              <Skeleton variant="circular" className="w-7 h-7 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          variant="no-comments"
          title="No discussions yet"
          description="Be the first to share your input, suggest implementation nuances, or discuss this proposal!"
          className="my-3 p-8 bg-slate-50/50"
        />
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
};
