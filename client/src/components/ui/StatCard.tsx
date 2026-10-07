import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import GlassCard from './GlassCard';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accent?: 'blue' | 'cyan' | 'green' | 'red' | 'amber';
}

const accentMap = {
  blue: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
  cyan: 'from-cyan-500/20 to-cyan-600/5 text-cyan-400 border-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]',
  green: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
  red: 'from-red-500/20 to-red-600/5 text-red-400 border-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
  amber: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
};

export default function StatCard({ title, value, icon: Icon, trend, accent = 'blue' }: StatCardProps) {
  const formatValue = (v: number | string | null | undefined): string => {
    if (typeof v === 'number') {
      if (!Number.isFinite(v) || isNaN(v)) return '0';
      return v.toLocaleString();
    }
    if (v === null || v === undefined) return '0';
    const str = String(v).trim();
    if (str === '' || str.includes('NaN') || str === 'null' || str === 'undefined') return '0';
    return str;
  };

  const [displayValue, setDisplayValue] = useState<string>(() => formatValue(value));

  useEffect(() => {
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || isNaN(value) || value <= 0) {
        setDisplayValue(formatValue(value));
        return;
      }

      let start = 0;
      const duration = 600; // ms
      const steps = Math.min(value, 30);
      const stepTime = Math.max(Math.floor(duration / steps), 16);
      const increment = Math.max(1, Math.ceil(value / steps));

      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          clearInterval(timer);
          setDisplayValue(value.toLocaleString());
        } else {
          setDisplayValue(start.toLocaleString());
        }
      }, stepTime);
      return () => clearInterval(timer);
    } else {
      setDisplayValue(formatValue(value));
    }
  }, [value]);

  const renderTrend = () => {
    if (!trend) return null;
    const isUp = trend.startsWith('+') || trend.toLowerCase().includes('up') || trend.toLowerCase().includes('high');
    const isDown = trend.startsWith('-') || trend.toLowerCase().includes('down');
    
    return (
      <div className="flex items-center gap-1.5 mt-2">
        {isUp ? (
          <TrendingUp size={13} className="text-red-400 shrink-0" />
        ) : isDown ? (
          <TrendingDown size={13} className="text-emerald-400 shrink-0" />
        ) : (
          <ArrowRight size={13} className="text-slate-400 shrink-0" />
        )}
        <span className={`text-xs font-medium ${
          isUp ? 'text-red-400' : isDown ? 'text-emerald-400' : 'text-slate-400'
        }`}>
          {trend}
        </span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard className="h-full border border-blue-500/10 hover:border-blue-500/25 transition-all overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-200 mb-2">{title}</p>
            <p className="text-3xl lg:text-4xl font-bold tracking-tight text-white tabular-nums leading-none mb-1">{displayValue}</p>
            {renderTrend()}
          </div>
          <div className={`p-2.5 rounded-xl bg-gradient-to-br border shrink-0 ${accentMap[accent]}`}>
            <Icon size={20} />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
