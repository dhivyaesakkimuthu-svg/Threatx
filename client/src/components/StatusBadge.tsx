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
  let badgeStyle = 'bg-gray-100 text-gray-600 border-gray-300';
  let dotStyle = 'bg-slate-400';

  if (
    normalized === 'online' ||
    normalized === 'connected' ||
    normalized === 'healthy' ||
    normalized === 'resolved' ||
    normalized === 'mitigated' ||
    normalized === 'active' ||
    normalized === 'generated'
  ) {
    badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-500/30';
    dotStyle = 'bg-emerald-400 animate-pulse shadow-sm';
  } else if (
    normalized === 'warning' ||
    normalized === 'degraded' ||
    normalized === 'pending' ||
    normalized === 'flagged' ||
    normalized === 'open'
  ) {
    badgeStyle = 'bg-amber-500/15 text-amber-600 border-amber-500/30';
    dotStyle = 'bg-amber-400 shadow-sm';
  } else if (normalized === 'investigating') {
    badgeStyle = 'bg-cyan-500/15 text-blue-500 border-blue-200';
    dotStyle = 'bg-cyan-400 shadow-sm';
  } else if (
    normalized === 'offline' ||
    normalized === 'disconnected' ||
    normalized === 'critical' ||
    normalized === 'blocked'
  ) {
    badgeStyle = 'bg-rose-500/15 text-rose-600 border-rose-200';
    dotStyle = 'bg-rose-400 animate-pulse shadow-sm';
  } else if (
    normalized === 'dismissed' ||
    normalized === 'idle' ||
    normalized === 'terminated'
  ) {
    badgeStyle = 'bg-gray-50 text-gray-500 border-gray-300/60';
    dotStyle = 'bg-slate-500';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-semibold font-mono',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold font-mono',
    lg: 'text-xs px-3 py-1.5 gap-2 font-bold font-mono',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border tracking-wider uppercase transition-colors select-none ${badgeStyle} ${sizeClasses[size]} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`} />}
      <span>{label}</span>
    </span>
  );
}

