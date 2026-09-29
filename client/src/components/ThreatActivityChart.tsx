import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Activity, Radio } from 'lucide-react';

interface ThreatTimelinePoint {
  time: string;
  count: number;
  high: number;
  medium: number;
  low: number;
}

interface ThreatActivityChartProps {
  timelineData?: ThreatTimelinePoint[];
  liveCount?: number;
}

export default function ThreatActivityChart({
  timelineData = [],
  liveCount = 24,
}: ThreatActivityChartProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  // Fallback demo dataset if none provided
  const chartData =
    timelineData.length > 0
      ? timelineData
      : [
          { time: '00:00', count: 3, high: 1, medium: 1, low: 1 },
          { time: '03:00', count: 2, high: 0, medium: 1, low: 1 },
          { time: '06:00', count: 5, high: 1, medium: 2, low: 2 },
          { time: '09:00', count: 12, high: 3, medium: 5, low: 4 },
          { time: '12:00', count: 18, high: 4, medium: 8, low: 6 },
          { time: '15:00', count: 15, high: 3, medium: 7, low: 5 },
          { time: '18:00', count: 22, high: 5, medium: 9, low: 8 },
          { time: '21:00', count: 24, high: 5, medium: 9, low: 10 },
        ];

  return (
    <div className="rounded-2xl bg-white  border border-gray-200 p-5 shadow-xl flex flex-col justify-between h-full">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Threat Activity Timeline &amp; Incident Velocity
            </h3>
            <p className="text-xs text-gray-500">
              Ingestion Rate: <span className="font-semibold text-blue-600 font-mono">18.4 events/sec</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Ingest Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-200 text-xs font-semibold text-rose-500">
            <Radio size={12} className="text-rose-600 animate-pulse" />
            <span>{liveCount} Active Threats</span>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex items-center bg-gray-50 border border-gray-200 p-0.5 rounded-xl text-xs font-medium">
            {(['1h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-0.5 rounded-lg transition-all uppercase cursor-pointer ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-gray-900 font-semibold shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-56 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="chartGradMed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="chartGradLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: 12,
                fontSize: 12,
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                color: '#F8FAFC',
              }}
              labelStyle={{ color: '#06B6D4', fontWeight: 'bold', marginBottom: 4 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              height={30}
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingBottom: 6 }}
            />
            <Area
              type="monotone"
              dataKey="high"
              stackId="1"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#chartGradHigh)"
              name="Critical/High"
            />
            <Area
              type="monotone"
              dataKey="medium"
              stackId="1"
              stroke="#F59E0B"
              strokeWidth={2}
              fill="url(#chartGradMed)"
              name="Medium Risk"
            />
            <Area
              type="monotone"
              dataKey="low"
              stackId="1"
              stroke="#06B6D4"
              strokeWidth={2}
              fill="url(#chartGradLow)"
              name="Low Risk / Probes"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200 text-center text-xs">
        <div className="p-2 rounded-xl bg-gray-50 border border-gray-200">
          <span className="text-[10px] text-gray-500 uppercase block font-medium">Peak Velocity</span>
          <span className="font-semibold text-gray-900 font-mono">24 events/min</span>
        </div>
        <div className="p-2 rounded-xl bg-gray-50 border border-gray-200">
          <span className="text-[10px] text-gray-500 uppercase block font-medium">Mitigation SLA</span>
          <span className="font-semibold text-emerald-600 font-mono">&lt; 15s</span>
        </div>
        <div className="p-2 rounded-xl bg-gray-50 border border-gray-200">
          <span className="text-[10px] text-gray-500 uppercase block font-medium">AI Auto-Triage</span>
          <span className="font-semibold text-blue-600 font-mono">Continuous</span>
        </div>
      </div>
    </div>
  );
}

