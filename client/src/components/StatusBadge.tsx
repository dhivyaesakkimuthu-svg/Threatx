export type SystemStatusType =
  | 'online'
  | 'connected'
  | 'healthy'
  | 'warning'
  | 'degraded'
  | 'offline'
  | 'disconnected'
  | 'open'
  | 'investigating'
  | 'resolved'
  | 'dismissed'
  | 'mitigated'
  | 'active'
  | 'flagged'
  | 'idle'
  | 'terminated'
  | 'generated'
  | 'blocked';

interface StatusBadgeProps {
  status: SystemStatusType | string;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function StatusBadge({
  status,
  showDot = true,
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  const normalized = (status || 'offline').toLowerCase();

  let label = status ? String(status).toUpperCase() : 'OFFLINE';
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotStyle = 'bg-slate-500';

  if (
    normalized === 'online' ||
    normalized === 'connected' ||
    normalized === 'healthy' ||
    normalized === 'resolved' ||
    normalized === 'mitigated' ||
    normalized === 'active' ||
    normalized === 'generated'
  ) {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotStyle = 'bg-emerald-500';
  } else if (
    normalized === 'warning' ||
    normalized === 'degraded' ||
    normalized === 'pending' ||
    normalized === 'flagged' ||
    normalized === 'open'
  ) {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    dotStyle = 'bg-amber-500';
  } else if (normalized === 'investigating') {
    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
    dotStyle = 'bg-blue-500';
  } else if (
    normalized === 'offline' ||
    normalized === 'disconnected' ||
    normalized === 'critical' ||
    normalized === 'blocked'
  ) {
    badgeStyle = 'bg-red-50 text-red-700 border-red-200';
    dotStyle = 'bg-red-500';
  } else if (
    normalized === 'dismissed' ||
    normalized === 'idle' ||
    normalized === 'terminated'
  ) {
    badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
    dotStyle = 'bg-slate-400';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-semibold',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-xs px-3 py-1.5 gap-2 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border tracking-wide uppercase transition-colors select-none ${badgeStyle} ${sizeClasses[size]} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`} />}
      <span>{label}</span>
    </span>
  );
}
