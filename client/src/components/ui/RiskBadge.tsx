import type { RiskLevel } from '../../types';

const styles: Record<RiskLevel, string> = {
  Low: 'bg-blue-50 text-blue-700 border-blue-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Critical: 'bg-red-50 text-red-700 border-red-200',
};

const dotColors: Record<RiskLevel, string> = {
  Low: 'bg-blue-600',
  Medium: 'bg-amber-600',
  High: 'bg-orange-600',
  Critical: 'bg-red-600',
};

export default function RiskBadge({ level }: { level: RiskLevel }) {
  const safeLevel: RiskLevel = styles[level] ? level : 'Low';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold tracking-wide border uppercase ${styles[safeLevel]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[safeLevel]}`} />
      {safeLevel}
    </span>
  );
}
