import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import GlassCard from './GlassCard';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accent?: 'blue' | 'cyan' | 'green' | 'red' | 'amber';
}

const accentMap = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  cyan: 'bg-teal-50 text-teal-600 border-teal-100',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
};

export default function StatCard({ title, value, icon: Icon, trend, accent = 'blue' }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(typeof value === 'number' ? 0 : value);

  useEffect(() => {
    if (typeof value === 'number') {
      let start = 0;
      const duration = 500;
      const stepTime = Math.max(Math.floor(duration / (value || 1)), 15);
      const timer = setInterval(() => {
        start += Math.ceil((value || 1) / (duration / stepTime));
        if (start >= value) {
          clearInterval(timer);
          setDisplayValue(value);
        } else {
          setDisplayValue(start);
        }
      }, stepTime);
      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  const renderTrend = () => {
    if (!trend) return null;
    const isUp = trend.startsWith('+') || trend.toLowerCase().includes('up') || trend.toLowerCase().includes('high');
    const isDown = trend.startsWith('-') || trend.toLowerCase().includes('down');
    
    return (
      <div className="flex items-center gap-1.5 mt-2">
        {isUp ? (
          <TrendingUp size={12} className="text-red-600 shrink-0" />
        ) : isDown ? (
          <TrendingDown size={12} className="text-emerald-600 shrink-0" />
        ) : (
          <ArrowRight size={12} className="text-slate-400 shrink-0" />
        )}
        <span className={`text-xs font-semibold ${
          isUp ? 'text-red-600' : isDown ? 'text-emerald-600' : 'text-slate-500'
        }`}>
          {trend}
        </span>
      </div>
    );
  };

  return (
    <GlassCard className="h-full border border-[#E4E7EC] hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">{displayValue}</p>
          {renderTrend()}
        </div>
        <div className={`p-2.5 rounded-xl border ${accentMap[accent]} shrink-0`}>
          <Icon size={18} />
        </div>
      </div>
    </GlassCard>
  );
}
