import React from 'react';
import {
  Inbox,
  Search,
  MessageSquare,
  Sparkles,
  Layers,
  LucideIcon,
  RotateCcw,
} from 'lucide-react';

export type EmptyStateVariant =
  | 'no-requests'
  | 'no-results'
  | 'no-comments'
  | 'no-roadmap'
  | 'custom';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no-results',
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  // Configs based on variant
  let defaultIcon: LucideIcon = Inbox;
  let defaultTitle = 'No items found';
  let defaultDescription = 'There are no items to display at this time.';
  let iconBg = 'bg-slate-100 text-slate-500';

  if (variant === 'no-results') {
    defaultIcon = Search;
    defaultTitle = 'No matching proposals';
    defaultDescription =
      'We couldn’t find any feature requests matching your filters or search keywords. Try adjusting your search query.';
    iconBg = 'bg-indigo-50 text-indigo-600';
  } else if (variant === 'no-requests') {
    defaultIcon = Sparkles;
    defaultTitle = 'No feature requests yet';
    defaultDescription =
      'Be the first to share an idea! Submit your proposal to kickstart community feedback and voting.';
    iconBg = 'bg-amber-50 text-amber-600';
  } else if (variant === 'no-comments') {
    defaultIcon = MessageSquare;
    defaultTitle = 'No comments yet';
    defaultDescription =
      'Start the discussion by sharing your thoughts or feedback on this proposal.';
    iconBg = 'bg-slate-100 text-slate-500';
  } else if (variant === 'no-roadmap') {
    defaultIcon = Layers;
    defaultTitle = 'No items in this stage';
    defaultDescription =
      'Proposals will appear here once they advance through community review and prioritization.';
    iconBg = 'bg-slate-100 text-slate-400';
  }

  const IconComponent = icon || defaultIcon;
  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;

  return (
    <div
      className={`bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-md mx-auto my-6 ${className}`}
    >
      <div
        className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mx-auto mb-4 shadow-2xs`}
      >
        <IconComponent className="w-6 h-6 stroke-[1.75]" />
      </div>

      <h3 className="text-base font-bold text-slate-900 mb-1.5">{finalTitle}</h3>
      <p className="text-xs text-slate-500 leading-relaxed mb-6 max-w-sm mx-auto">
        {finalDescription}
      </p>

      {(onAction || onSecondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {onAction && actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>{actionLabel}</span>
            </button>
          )}

          {onSecondaryAction && secondaryActionLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
