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
    <div className="rounded-2xl bg-white border border-[#E4E7EC] p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Threat Activity Timeline
            </h3>
            <p className="text-xs text-slate-500">
              Ingestion Rate: <span className="font-semibold text-slate-800">18.4 eps</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Ingest Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            <Radio size={12} className="text-red-600" />
            <span>{liveCount} Active Threats</span>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            {(['1h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-0.5 rounded-md transition-all uppercase cursor-pointer ${
                  timeRange === range
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
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
                <stop offset="0%" stopColor="#DC2626" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#DC2626" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="chartGradMed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D97706" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#D97706" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="chartGradLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F9" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                fontSize: 12,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
              }}
              labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: 4 }}
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
              stroke="#DC2626"
              strokeWidth={2}
              fill="url(#chartGradHigh)"
              name="Critical/High"
            />
            <Area
              type="monotone"
              dataKey="medium"
              stackId="1"
              stroke="#D97706"
              strokeWidth={2}
              fill="url(#chartGradMed)"
              name="Medium Risk"
            />
            <Area
              type="monotone"
              dataKey="low"
              stackId="1"
              stroke="#2563EB"
              strokeWidth={2}
              fill="url(#chartGradLow)"
              name="Low Risk / Probes"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-500 uppercase block font-medium">Peak Ingest</span>
          <span className="font-semibold text-slate-800">24 threats/hr</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-500 uppercase block font-medium">Mitigation SLA</span>
          <span className="font-semibold text-emerald-700">&lt; 45s</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-slate-500 uppercase block font-medium">Auto-Defense</span>
          <span className="font-semibold text-blue-700">Active</span>
        </div>
      </div>
    </div>
  );
}
