export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'Critical' | 'High' | 'Medium' | 'Low';

interface SeverityBadgeProps {
  severity: SeverityLevel | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showDot?: boolean;
}

export default function SeverityBadge({
  severity,
  size = 'md',
  className = '',
  showDot = true,
}: SeverityBadgeProps) {
  const norm = (severity || 'low').toLowerCase();

  let label = 'LOW';
  let badgeStyle = 'bg-cyan-500/15 text-blue-500 border-blue-200';
  let dotStyle = 'bg-cyan-400';

  if (norm === 'critical') {
    label = 'CRITICAL';
    badgeStyle = 'bg-rose-50 text-rose-600 border-rose-500/40';
    dotStyle = 'bg-rose-500 animate-pulse shadow-sm';
  } else if (norm === 'high') {
    label = 'HIGH';
    badgeStyle = 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    dotStyle = 'bg-orange-500 shadow-sm';
  } else if (norm === 'medium') {
    label = 'MEDIUM';
    badgeStyle = 'bg-amber-500/20 text-amber-600 border-amber-500/40';
    dotStyle = 'bg-amber-500 shadow-sm';
  } else if (norm === 'low') {
    label = 'LOW';
    badgeStyle = 'bg-cyan-500/15 text-blue-500 border-blue-200';
    dotStyle = 'bg-cyan-400 shadow-sm';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-semibold font-mono',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-semibold font-mono',
    lg: 'text-xs px-3 py-1 gap-2 font-bold font-mono',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border tracking-wider uppercase select-none ${badgeStyle} ${sizeClasses[size]} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`} />}
      <span>{label}</span>
    </span>
  );
}

