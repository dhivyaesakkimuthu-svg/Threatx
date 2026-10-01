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
  const [displayValue, setDisplayValue] = useState<number | string>(typeof value === 'number' ? 0 : value);

  useEffect(() => {
    if (typeof value === 'number') {
      let start = 0;
      const duration = 800; // ms
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
          <TrendingUp size={12} className="text-red-400 shrink-0" />
        ) : isDown ? (
          <TrendingDown size={12} className="text-emerald-400 shrink-0" />
        ) : (
          <ArrowRight size={12} className="text-slate-500 shrink-0" />
        )}
        <span className={`text-xs font-semibold ${
          isUp ? 'text-red-400/95' : isDown ? 'text-emerald-400/95' : 'text-slate-500'
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
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard className="h-full border border-blue-500/10 hover:border-blue-500/25 transition-all overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
            <p className="text-3xl font-extrabold tracking-tight text-slate-100">{displayValue}</p>
            {renderTrend()}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br border ${accentMap[accent]}`}>
            <Icon size={20} />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
