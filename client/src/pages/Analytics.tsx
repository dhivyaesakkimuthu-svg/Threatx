import { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  ShieldAlert,
  Server as ServerIcon,
  Users,
  RefreshCw,
  Bell,
  Activity,
} from 'lucide-react';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api, type AnalyticsData } from '../services/api';

const SEVERITY_COLORS = {
  critical: '#F43F5E',
  high: '#FB923C',
  medium: '#FBBF24',
  low: '#34D399',
};

const STATUS_COLORS = {
  open: '#FBBF24',
  investigating: '#22D3EE',
  resolved: '#34D399',
  dismissed: '#64748B',
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await api.getAnalytics();
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load enterprise SOC analytics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 15000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Topbar title="Security Analytics" subtitle="Compiling MongoDB security telemetry..." />
        <LoadingState />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <Topbar title="Security Analytics" connectionStatus="offline" />
        <ErrorState message={error} onRetry={loadAnalytics} />
      </div>
    );
  }

  const riskDist = data?.riskDistribution || { low: 0, medium: 0, high: 2, critical: 0 };
  const pieData = [
    { name: 'Critical', value: riskDist.critical, color: SEVERITY_COLORS.critical },
    { name: 'High Risk', value: riskDist.high, color: SEVERITY_COLORS.high },
    { name: 'Medium Risk', value: riskDist.medium, color: SEVERITY_COLORS.medium },
    { name: 'Low Risk', value: riskDist.low, color: SEVERITY_COLORS.low },
  ].filter((p) => p.value > 0);

  const typeData = Object.entries(data?.threatTypeBreakdown || {}).map(([type, count]) => ({
    name: type,
    count,
  }));

  const alertsStatusData = [
    { name: 'Open', count: data?.alertsByStatus?.open || 0, fill: STATUS_COLORS.open },
    { name: 'Investigating', count: data?.alertsByStatus?.investigating || 0, fill: STATUS_COLORS.investigating },
    { name: 'Resolved', count: data?.alertsByStatus?.resolved || 0, fill: STATUS_COLORS.resolved },
    { name: 'Dismissed', count: data?.alertsByStatus?.dismissed || 0, fill: STATUS_COLORS.dismissed },
  ];

  const serverHealthData = [
    { name: 'Healthy', value: data?.serverHealthDistribution?.healthy || (data?.onlineServers ?? 3), color: '#34D399' },
    { name: 'Warning', value: data?.serverHealthDistribution?.warning || 0, color: '#FBBF24' },
    { name: 'Degraded', value: data?.serverHealthDistribution?.degraded || 0, color: '#F43F5E' },
    { name: 'Critical', value: data?.serverHealthDistribution?.critical || 0, color: '#E11D48' },
  ].filter((p) => p.value > 0);

  const timelineData = data?.timeline || [];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <Topbar
        title="Security Analytics & Metrics"
        subtitle="Deep threat telemetry, severity distributions, triage stats and infrastructure performance"
      />

      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Security Posture Score"
          value={`${data?.securityScore ?? 88}/100`}
          icon={TrendingUp}
          accent="cyan"
          trend="Cluster Security Rating"
          trendDirection="up"
        />
        <StatCard
          title="Active Attack Threats"
          value={data?.activeThreats ?? 2}
          icon={ShieldAlert}
          accent="red"
          trend="Requiring SOC Triage"
          trendDirection="up"
        />
        <StatCard
          title="Monitored Server Nodes"
          value={`${data?.onlineServers ?? 3}/${data?.totalServers ?? 3}`}
          icon={ServerIcon}
          accent="green"
          trend="100% Online"
          trendDirection="neutral"
        />
        <StatCard
          title="Active Sessions"
          value={data?.activeSessions ?? 4}
          icon={Users}
          accent="cyan"
          trend="Real-time Connections"
          trendDirection="neutral"
        />
      </div>

      {/* Primary Visual Charts Row: Threat Vectors Breakdown & Threat Severity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Type Breakdown Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-200  p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Threat Vectors Distribution
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                Categorized threat signatures ingested into MongoDB
              </p>
            </div>
            <button
              onClick={() => {
                setIsRefreshing(true);
                loadAnalytics();
              }}
              className="p-2 text-gray-500 hover:text-gray-900 rounded-xl bg-gray-50 border border-gray-200 transition-colors cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>

          <div className="h-64">
            {typeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 font-mono">
                No threat vectors recorded in database
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={170}
                    tick={{ fill: '#E2E8F0', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0E1A',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    }}
                  />
                  <Bar dataKey="count" fill="#06B6D4" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Severity Distribution Pie */}
        <div className="rounded-2xl bg-white border border-gray-200  p-5 shadow-xl flex flex-col justify-between">
          <div className="pb-3 border-b border-gray-200 mb-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Threat Severity Split
            </h3>
            <p className="text-xs text-gray-500 font-mono">
              Proportion of Critical, High, Medium, and Low risks
            </p>
          </div>

          <div className="h-48 flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-xs text-gray-400 font-mono">No active threat distribution</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0E1A',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-rose-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
              Critical: {riskDist.critical}
            </div>
            <div className="flex items-center gap-1.5 text-orange-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-sm" />
              High: {riskDist.high}
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
              Medium: {riskDist.medium}
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
              Low: {riskDist.low}
            </div>
          </div>
        </div>
      </div>

      {/* Second Charts Row: Alerts by Status & Server Health Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alerts by Status */}
        <div className="rounded-2xl bg-white border border-gray-200  p-5 shadow-xl">
          <div className="pb-3 border-b border-gray-200 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Bell size={16} className="text-amber-600" /> Alerts Triage Status
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                Open, Investigating, Resolved, and Dismissed incidents
              </p>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertsStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0E1A',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                  }}
                />
                <Bar dataKey="count" name="Alert Count" radius={[6, 6, 0, 0]}>
                  {alertsStatusData.map((entry, index) => (
                    <Cell key={`alert-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Server Health Distribution */}
        <div className="rounded-2xl bg-white border border-gray-200  p-5 shadow-xl flex flex-col justify-between">
          <div className="pb-3 border-b border-gray-200 mb-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <ServerIcon size={16} className="text-blue-600" /> Infrastructure Health Breakdown
            </h3>
            <p className="text-xs text-gray-500 font-mono">
              Cluster node condition and availability states
            </p>
          </div>

          <div className="h-44 flex items-center justify-center">
            {serverHealthData.length === 0 ? (
              <div className="text-xs text-gray-400 font-mono">No servers active</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serverHealthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {serverHealthData.map((entry, index) => (
                      <Cell key={`srv-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0E1A',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
              Healthy: {data?.serverHealthDistribution?.healthy ?? data?.onlineServers ?? 3}
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
              Warning: {data?.serverHealthDistribution?.warning ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
              Degraded: {data?.serverHealthDistribution?.degraded ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-rose-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-600 shadow-sm" />
              Critical: {data?.serverHealthDistribution?.critical ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Area Ingress Timeline */}
      <div className="rounded-2xl bg-white border border-gray-200  p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-blue-600" /> 24-Hour Threat Ingress Timeline
            </h3>
            <p className="text-xs text-gray-500 font-mono">
              Temporal event correlation from MongoDB security documents
            </p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="threatAnalyticsArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0E1A',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#F8FAFC',
                }}
              />
              <Area type="monotone" dataKey="count" stroke="#06B6D4" strokeWidth={2.5} fill="url(#threatAnalyticsArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
