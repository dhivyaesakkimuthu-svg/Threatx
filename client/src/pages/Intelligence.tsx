import { useEffect, useState, useCallback } from 'react';
import {
  Brain,
  Zap,
  Activity,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Terminal,
} from 'lucide-react';
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
} from 'recharts';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../services/api';
import { subscribeToIntelligence } from '../services/socket';
import type { IntelligenceDecision, IntelligenceStats } from '../types';

const RISK_COLORS = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D97706',
  low: '#16A34A',
};

export default function Intelligence() {
  const [stats, setStats] = useState<IntelligenceStats | null>(null);
  const [decisions, setDecisions] = useState<IntelligenceDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sandbox simulation state
  const [sandboxEventType, setSandboxEventType] = useState('failed_login');
  const [sandboxIp, setSandboxIp] = useState('198.51.100.45');
  const [sandboxCpu, setSandboxCpu] = useState(88);
  const [sandboxSessions, setSandboxSessions] = useState(12);
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsData, decisionsData] = await Promise.all([
        api.getIntelligenceStats(),
        api.getIntelligenceDecisions({ limit: 50 }),
      ]);
      setStats(statsData || null);
      setDecisions(decisionsData?.data || (Array.isArray(decisionsData) ? decisionsData : []));
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load intelligence telemetry');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Real-time listener for intelligence:new
  useEffect(() => {
    const unsub = subscribeToIntelligence((payload: any) => {
      if (payload && payload.analysis) {
        const newDecision: IntelligenceDecision = {
          decisionId: `DEC-${Math.floor(10000 + Math.random() * 90000)}`,
          source: 'threat_intelligence_engine',
          sourceIp: payload.event?.source_ip || payload.threat?.source || '127.0.0.1',
          eventType: payload.event?.event_type || payload.threat?.type || 'security_event',
          riskScore: payload.analysis.riskScore,
          riskLevel: payload.analysis.riskLevel,
          confidence: payload.analysis.confidence,
          reasons: payload.analysis.reasons || [],
          anomalies: payload.analysis.anomalies || [],
          recommendedAction: payload.analysis.recommendedAction || '',
          analyzedAt: payload.timestamp || new Date().toISOString(),
        };

        setDecisions((prev) => [newDecision, ...prev.slice(0, 49)]);
        setStats((prev) => {
          if (!prev) return prev;
          const isHigh = newDecision.riskLevel === 'high';
          const isCrit = newDecision.riskLevel === 'critical';
          return {
            ...prev,
            totalAnalyzed: prev.totalAnalyzed + 1,
            anomaliesDetected: prev.anomaliesDetected + (newDecision.anomalies.length > 0 ? 1 : 0),
            highRiskCount: prev.highRiskCount + (isHigh ? 1 : 0),
            criticalRiskCount: prev.criticalRiskCount + (isCrit ? 1 : 0),
          };
        });
      }
    });
    return () => unsub();
  }, []);

  const handleManualAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeEvent({
        event: {
          event_type: sandboxEventType,
          source_ip: sandboxIp,
          severity: sandboxCpu > 80 ? 'high' : 'medium',
          details: `Manual test evaluation: ${sandboxEventType} from ${sandboxIp}`,
        },
        telemetry: {
          cpuUsage: sandboxCpu,
          memoryUsage: 65,
          activeSessions: sandboxSessions,
        },
      });
      setSandboxResult(res);
    } catch (e: any) {
      console.error('Manual analyze failed', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredDecisions = decisions.filter((d) => {
    if (filterRisk !== 'all' && d.riskLevel !== filterRisk) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchIp = d.sourceIp?.toLowerCase().includes(q);
      const matchType = d.eventType?.toLowerCase().includes(q);
      const matchReasons = d.reasons?.some((r) => r.toLowerCase().includes(q));
      return matchIp || matchType || matchReasons;
    }
    return true;
  });

  const pageSize = 8;
  const totalPages = Math.ceil(filteredDecisions.length / pageSize) || 1;
  const paginatedDecisions = filteredDecisions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const riskPieData = stats?.riskDistribution
    ? [
        { name: 'Critical', value: stats.riskDistribution.critical || 0, color: RISK_COLORS.critical },
        { name: 'High', value: stats.riskDistribution.high || 0, color: RISK_COLORS.high },
        { name: 'Medium', value: stats.riskDistribution.medium || 0, color: RISK_COLORS.medium },
        { name: 'Low', value: stats.riskDistribution.low || 0, color: RISK_COLORS.low },
      ]
    : [
        { name: 'Critical', value: 2, color: RISK_COLORS.critical },
        { name: 'High', value: 5, color: RISK_COLORS.high },
        { name: 'Medium', value: 8, color: RISK_COLORS.medium },
        { name: 'Low', value: 15, color: RISK_COLORS.low },
      ];

  const anomalyDistribution = [
    { name: 'CPU Spike', count: decisions.filter((d) => d.anomalies?.includes('CPU_SPIKE_ANOMALY')).length },
    { name: 'Brute Force', count: decisions.filter((d) => d.anomalies?.includes('AUTH_BRUTE_FORCE')).length },
    { name: 'Session Surge', count: decisions.filter((d) => d.anomalies?.includes('SESSION_SPIKE_ANOMALY')).length },
    { name: 'Repeat Source', count: decisions.filter((d) => d.anomalies?.includes('REPEATED_SOURCE_ACTIVITY')).length },
    { name: 'Multi-Vector', count: decisions.filter((d) => d.anomalies?.includes('CORRELATED_MULTI_VECTOR')).length },
  ];

  if (loading && !isRefreshing) {
    return <LoadingState message="Connecting to ThreatX AI Intelligence Engine..." />;
  }

  if (error && !stats) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const overallRisk = stats?.overallRiskScore ?? 45;
  const overallRiskLevel =
    overallRisk >= 75 ? 'Critical' : overallRisk >= 50 ? 'High' : overallRisk >= 25 ? 'Medium' : 'Low';

  return (
    <div className="space-y-6">
      <Topbar
        title="AI Threat Intelligence & Anomaly Detection"
        subtitle="Real-time explainable risk scoring, behavioral correlation, and telemetry anomaly analysis"
      />

      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="rounded-xl bg-white border border-[#E4E7EC] p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold tracking-tight text-[#172033]">ThreatX AI Neural Analyzer</h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    ENGINE ACTIVE
                  </span>
                </div>
                <p className="text-[#667085] text-xs mt-0.5">
                  Continuous multi-vector risk evaluation &amp; telemetry anomaly heuristics pipeline
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsRefreshing(true);
                  loadData();
                }}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 border border-[#E4E7EC] text-[#172033] text-xs font-semibold transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                Refresh Intelligence
              </button>
            </div>
          </div>
        </div>

        {/* Core KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Overall Platform Risk"
            value={`${overallRisk}/100`}
            trend={`Classified as ${overallRiskLevel.toUpperCase()}`}
            trendDirection={overallRisk >= 50 ? 'up' : 'neutral'}
            icon={Brain}
            accent={overallRisk >= 75 ? 'red' : overallRisk >= 50 ? 'amber' : 'blue'}
          />
          <StatCard
            title="Total Events Analyzed"
            value={stats?.totalAnalyzed ?? decisions.length}
            trend="Multi-vector Scans"
            trendDirection="neutral"
            icon={Activity}
            accent="cyan"
          />
          <StatCard
            title="Anomalies Flagged"
            value={stats?.anomaliesDetected ?? 7}
            trend="Telemetry Triggers"
            trendDirection="up"
            icon={AlertTriangle}
            accent="amber"
          />
          <StatCard
            title="High / Critical Threats"
            value={(stats?.highRiskCount || 0) + (stats?.criticalRiskCount || 0)}
            trend="Active Containment"
            trendDirection="down"
            icon={Zap}
            accent="red"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Anomaly Distribution Chart */}
          <div className="lg:col-span-2 rounded-xl bg-white border border-[#E4E7EC] p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2 uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Detected Anomaly Categories
                </h3>
                <p className="text-[11px] text-[#667085] mt-0.5">Distribution of heuristic anomaly triggers</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={anomalyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F9" vertical={false} />
                  <XAxis dataKey="name" stroke="#667085" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#667085" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E4E7EC',
                      borderRadius: '8px',
                      color: '#172033',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Level Distribution Pie */}
          <div className="rounded-xl bg-white border border-[#E4E7EC] p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Risk Severity Breakdown
              </h3>
              <p className="text-[11px] text-[#667085] mt-0.5">AI risk score categorization</p>
            </div>

            <div className="h-44 w-full flex items-center justify-center my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E4E7EC',
                      borderRadius: '8px',
                      color: '#172033',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E4E7EC] text-xs">
              {riskPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-[#667085]">{item.name}:</span>
                  <span className="font-semibold text-[#172033]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Threat Intelligence Sandbox */}
        <div className="rounded-xl bg-white border border-[#E4E7EC] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033]">Interactive AI Threat Evaluation Sandbox</h3>
                <p className="text-xs text-[#667085]">
                  Simulate events against the neural analyzer to inspect explainable scoring rationales
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
                Event Signature
              </label>
              <select
                value={sandboxEventType}
                onChange={(e) => setSandboxEventType(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4E7EC] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-blue-500"
              >
                <option value="failed_login">failed_login (Authentication Failure)</option>
                <option value="credential_dump">credential_dump (LSASS Extraction)</option>
                <option value="impossible_travel">impossible_travel (Geo Anomaly)</option>
                <option value="sensitive_download">sensitive_download (Data Exfil)</option>
                <option value="port_scan">port_scan (Reconnaissance)</option>
                <option value="service_started">service_started (Nominal Check)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
                Source IP Address
              </label>
              <input
                type="text"
                value={sandboxIp}
                onChange={(e) => setSandboxIp(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E4E7EC] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
                Host CPU Load: <span className="text-blue-600 font-bold">{sandboxCpu}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={sandboxCpu}
                onChange={(e) => setSandboxCpu(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
                Active Sessions: <span className="text-teal-600 font-bold">{sandboxSessions}</span>
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={sandboxSessions}
                onChange={(e) => setSandboxSessions(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <div className="flex items-end lg:col-span-1">
              <button
                onClick={handleManualAnalyze}
                disabled={isAnalyzing}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Run AI Assessment
              </button>
            </div>
          </div>

          {/* Sandbox Result Output */}
          {sandboxResult && (
            <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4E7EC]">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
                      sandboxResult.riskLevel === 'critical'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : sandboxResult.riskLevel === 'high'
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : sandboxResult.riskLevel === 'medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {sandboxResult.riskLevel} RISK ({sandboxResult.riskScore}/100)
                  </span>
                  <span className="text-xs text-[#667085] font-mono">
                    Confidence: <span className="text-blue-700 font-bold">{sandboxResult.confidence}%</span>
                  </span>
                </div>

                {sandboxResult.anomalies?.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {sandboxResult.anomalies.map((anom: string) => (
                      <span key={anom} className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-mono border border-amber-200 font-semibold">
                        {anom}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-2">
                <div className="text-xs font-bold text-[#172033] uppercase tracking-wider">Explainable AI Rationales:</div>
                <ul className="space-y-1 text-xs text-[#172033] list-disc list-inside">
                  {sandboxResult.reasons?.map((reason: string, i: number) => (
                    <li key={i} className="text-[#172033]">
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs">
                <span className="font-semibold text-blue-900">Automated Recommendation: </span>
                <span className="text-blue-800">{sandboxResult.recommendedAction}</span>
              </div>
            </div>
          )}
        </div>

        {/* AI Decision Stream & History Table */}
        <div className="rounded-xl bg-white border border-[#E4E7EC] p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                Recent AI Intelligence Decisions &amp; Explanations
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Full chronological audit trail of all AI risk assessments and anomaly triggers
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search IP, event, or reasons..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-4 py-1.5 bg-[#F8FAFC] border border-[#E4E7EC] rounded-lg text-xs text-[#172033] placeholder-[#667085] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex rounded-lg bg-slate-100 border border-[#E4E7EC] p-0.5 text-xs">
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setFilterRisk(r);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded capitalize transition-all font-semibold ${
                      filterRisk === r ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-[#667085] hover:text-[#172033]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Decision Cards List */}
          <div className="space-y-3">
            {paginatedDecisions.length === 0 ? (
              <div className="py-12 text-center text-[#667085] text-sm">
                No AI intelligence decisions matched your criteria.
              </div>
            ) : (
              paginatedDecisions.map((dec) => {
                const isCrit = dec.riskLevel === 'critical';
                const isHigh = dec.riskLevel === 'high';
                return (
                  <div
                    key={dec.decisionId || dec.id}
                    className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] hover:bg-white hover:border-blue-300 transition-all hover:shadow-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            isCrit
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : isHigh
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : dec.riskLevel === 'medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {dec.riskLevel} ({dec.riskScore}/100)
                        </span>
                        <span className="text-xs font-bold text-[#172033] font-mono">
                          {dec.eventType?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-[#667085]">
                          Source: <span className="text-blue-700 font-mono font-semibold">{dec.sourceIp}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#667085]">
                        <span className="font-mono font-semibold">Confidence: {dec.confidence}%</span>
                        <span>•</span>
                        <span>{new Date(dec.analyzedAt || dec.createdAt || Date.now()).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Detected Anomalies */}
                    {dec.anomalies && dec.anomalies.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {dec.anomalies.map((anom) => (
                          <span
                            key={anom}
                            className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-mono border border-amber-200 font-semibold"
                          >
                            ⚡ {anom}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Explainable Reasons */}
                    <div className="pt-1">
                      <ul className="space-y-1 text-xs text-[#172033]">
                        {dec.reasons?.map((reason, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-blue-600 font-bold">›</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommended Action */}
                    {dec.recommendedAction && (
                      <div className="p-2 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-900">
                        <span className="font-semibold text-blue-950">Recommended Action: </span>
                        {dec.recommendedAction}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E4E7EC] text-xs text-[#667085]">
              <span>
                Showing page <strong className="text-[#172033]">{currentPage}</strong> of <strong className="text-[#172033]">{totalPages}</strong> ({filteredDecisions.length} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

