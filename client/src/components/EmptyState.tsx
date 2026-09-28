import { Inbox, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
  icon?: any;
}

export default function EmptyState({
  title = 'No records found',
  description = 'There are no active data records matching your criteria in the database.',
  onAction,
  actionLabel = 'Refresh Data',
  icon: Icon = Inbox,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] text-center">
      <div className="p-3 rounded-xl bg-white text-blue-600 mb-3 border border-[#E4E7EC] shadow-2xs">
        <Icon size={22} />
      </div>
      <h4 className="text-sm font-bold text-[#172033] uppercase tracking-wider">{title}</h4>
      <p className="text-xs text-[#667085] max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-blue-700 border border-[#E4E7EC] text-xs font-semibold shadow-2xs transition-all"
        >
          <RefreshCw size={13} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

