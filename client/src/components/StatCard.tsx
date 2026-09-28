import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  accent?: 'blue' | 'cyan' | 'green' | 'red' | 'amber' | 'purple';
  subtitle?: string;
  onClick?: () => void;
}

const accentMap = {
  blue: {
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    borderHover: 'hover:border-blue-200',
  },
  cyan: {
    iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
    borderHover: 'hover:border-teal-200',
  },
  green: {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    borderHover: 'hover:border-emerald-200',
  },
  red: {
    iconBg: 'bg-red-50 text-red-600 border-red-100',
    borderHover: 'hover:border-red-200',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    borderHover: 'hover:border-amber-200',
  },
  purple: {
    iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    borderHover: 'hover:border-purple-200',
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection,
  accent = 'blue',
  subtitle,
  onClick,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(
    value ?? 0
  );

  useEffect(() => {
    if (typeof value === 'number' && !isNaN(value) && value > 0) {
      let start = 0;
      const duration = 350;
      const stepTime = Math.max(Math.floor(duration / value), 15);
      const timer = setInterval(() => {
        start += Math.ceil(value / (duration / stepTime));
        if (start >= value) {
          clearInterval(timer);
          setDisplayValue(value);
        } else {
          setDisplayValue(start);
        }
      }, stepTime);
      return () => clearInterval(timer);
    } else {
      setDisplayValue(value ?? 0);
    }
  }, [value]);

  const style = accentMap[accent] || accentMap.blue;

  const renderTrend = () => {
    if (!trend) return null;
    const isUp = trendDirection ? trendDirection === 'up' : trend.startsWith('+') || trend.toLowerCase().includes('high');
    const isDown = trendDirection ? trendDirection === 'down' : trend.startsWith('-');

    return (
      <div className="flex items-center gap-1.5 mt-2">
        {isUp ? (
          <TrendingUp size={13} className="text-red-600 shrink-0" />
        ) : isDown ? (
          <TrendingDown size={13} className="text-emerald-600 shrink-0" />
        ) : (
          <ArrowRight size={13} className="text-slate-400 shrink-0" />
        )}
        <span
          className={`text-xs font-semibold ${
            isUp ? 'text-red-600' : isDown ? 'text-emerald-600' : 'text-slate-500'
          }`}
        >
          {trend}
        </span>
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white border border-[#E4E7EC] shadow-xs p-5 transition-all duration-150 ${style.borderHover} ${
        onClick ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              {displayValue}
            </span>
          </div>
          {renderTrend()}
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>

        <div className={`p-2.5 rounded-xl border ${style.iconBg} shrink-0`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
