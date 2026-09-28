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
  let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
  let dotStyle = 'bg-blue-500';

  if (norm === 'critical') {
    label = 'CRITICAL';
    badgeStyle = 'bg-red-50 text-red-700 border-red-200';
    dotStyle = 'bg-red-600';
  } else if (norm === 'high') {
    label = 'HIGH';
    badgeStyle = 'bg-orange-50 text-orange-700 border-orange-200';
    dotStyle = 'bg-orange-600';
  } else if (norm === 'medium') {
    label = 'MEDIUM';
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    dotStyle = 'bg-amber-600';
  } else if (norm === 'low') {
    label = 'LOW';
    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
    dotStyle = 'bg-blue-600';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-semibold',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-semibold',
    lg: 'text-xs px-3 py-1 gap-2 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border tracking-wide uppercase select-none ${badgeStyle} ${sizeClasses[size]} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`} />}
      <span>{label}</span>
    </span>
  );
}
