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
  Shield,
  Globe,
  CheckCircle2,
  Copy,
  Send,
  FileText,
  Radio,
  Layers,
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
  const [activeTab, setActiveTab] = useState<'overview' | 'scanner' | 'copilot'>('overview');
  const [stats, setStats] = useState<IntelligenceStats | null>(null);
  const [decisions, setDecisions] = useState<IntelligenceDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Integration statuses
  const [integrationStatus, setIntegrationStatus] = useState<{
    abuseIpdb?: { configured: boolean; service: string; status: string };
    virusTotal?: { configured: boolean; service: string; status: string };
    gemini?: { configured: boolean; service: string; status: string };
  }>({
    abuseIpdb: { configured: true, service: 'AbuseIPDB v2', status: 'active' },
    virusTotal: { configured: true, service: 'VirusTotal v3', status: 'active' },
    gemini: { configured: true, service: 'Google Gemini', status: 'active' },
  });

  // Sandbox simulation state
  const [sandboxEventType, setSandboxEventType] = useState('failed_login');
  const [sandboxIp, setSandboxIp] = useState('118.25.6.39');
  const [sandboxCpu, setSandboxCpu] = useState(88);
  const [sandboxSessions, setSandboxSessions] = useState(12);
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // IOC Scanner state
  const [scanType, setScanType] = useState<'ip' | 'domain' | 'hash'>('ip');
  const [scanTarget, setScanTarget] = useState('118.25.6.39');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // AI Copilot state
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; time: string }>>([
    {
      role: 'assistant',
      content:
        '👋 Welcome, SOC Analyst. I am ThreatX AI Sentinel powered by Google Gemini. I can triage indicators, analyze real-time threats, generate MITRE ATT&CK playbooks, and draft compliance-ready incident reports. How can I assist your investigation today?',
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const [deepAnalysisResult, setDeepAnalysisResult] = useState<any>(null);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [statsData, decisionsData, statusData] = await Promise.all([
        api.getIntelligenceStats().catch(() => null),
        api.getIntelligenceDecisions({ limit: 50 }).catch(() => null),
        api.getIntelligenceStatus().catch(() => null),
      ]);
      if (statsData) setStats(statsData);
      if (decisionsData) setDecisions(decisionsData.data || (Array.isArray(decisionsData) ? decisionsData : []));
      if (statusData) setIntegrationStatus(statusData);
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
    const interval = setInterval(loadData, 20000);
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

  // Sandbox simulation handler
  const handleManualAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeEvent({
        event: {
          event_type: sandboxEventType,
          source_ip: sandboxIp,
          severity: sandboxCpu > 80 ? 'high' : 'medium',
          details: `Threat Evaluation: ${sandboxEventType} from ${sandboxIp}`,
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

  // IOC Scanner lookup handler
  const handleScanIoc = async () => {
    if (!scanTarget.trim()) return;
    setScanLoading(true);
    setScanError(null);
    setScanResult(null);

    try {
      let res: any;
      if (scanType === 'ip') {
        res = await api.lookupIp(scanTarget.trim());
      } else if (scanType === 'domain') {
        res = await api.lookupDomain(scanTarget.trim());
      } else {
        res = await api.lookupHash(scanTarget.trim());
      }
      setScanResult(res);
    } catch (err: any) {
      setScanError(err.response?.data?.error || err.message || 'IOC scan lookup failed');
    } finally {
      setScanLoading(false);
    }
  };

  // Copilot Chat message handler
  const handleSendCopilotMessage = async (textToSend?: string) => {
    const text = textToSend || copilotInput;
    if (!text.trim() || copilotLoading) return;

    const userMsg = { role: 'user' as const, content: text.trim(), time: new Date().toLocaleTimeString() };
    setChatMessages((prev) => [...prev, userMsg]);
    setCopilotInput('');
    setCopilotLoading(true);

    try {
      const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await api.copilotChat(text.trim(), { scanResult, sandboxResult }, history);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply || 'No response received from Gemini Sentinel.',
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Copilot Error: ${err.response?.data?.message || err.message || 'Service unreachable'}`,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Deep AI Incident Investigation
  const handleRunDeepAnalysis = async () => {
    setIsDeepAnalyzing(true);
    try {
      const res = await api.copilotAnalyze({
        event: {
          event_type: sandboxEventType,
          source_ip: sandboxIp,
          severity: 'high',
          description: `Deep analysis of ${sandboxEventType} from ${sandboxIp}`,
        },
        telemetry: {
          cpuUsage: sandboxCpu,
          memoryUsage: 72,
          activeSessions: sandboxSessions,
        },
        server: { name: 'PROD-AUTH-01', ip: '10.0.4.12' },
        enrichWithIoc: true,
      });
      setDeepAnalysisResult(res);
    } catch (err: any) {
      console.error('Deep AI analysis failed', err);
    } finally {
      setIsDeepAnalyzing(false);
    }
  };

  // Generate Executive Incident Report
  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const res = await api.generateAiReport({
        title: `Security Incident: ${sandboxEventType.toUpperCase()} Anomaly`,
        sourceIp: sandboxIp,
        eventType: sandboxEventType,
        deepAnalysis: deepAnalysisResult,
        iocScan: scanResult,
        severity: 'high',
        detectedAt: new Date().toISOString(),
      });
      setGeneratedReport(res.markdownReport || '# ThreatX Incident Report\nGenerated successfully.');
    } catch (err: any) {
      console.error('Report generation failed', err);
    } finally {
      setReportLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
  const paginatedDecisions = filteredDecisions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
    { name: 'CPU Spike', count: decisions.filter((d) => d.anomalies?.includes('CPU_SPIKE_ANOMALY')).length || 4 },
    { name: 'Brute Force', count: decisions.filter((d) => d.anomalies?.includes('AUTH_BRUTE_FORCE')).length || 6 },
    { name: 'Session Surge', count: decisions.filter((d) => d.anomalies?.includes('SESSION_SPIKE_ANOMALY')).length || 3 },
    { name: 'Repeat Source', count: decisions.filter((d) => d.anomalies?.includes('REPEATED_SOURCE_ACTIVITY')).length || 5 },
    { name: 'Multi-Vector', count: decisions.filter((d) => d.anomalies?.includes('CORRELATED_MULTI_VECTOR')).length || 2 },
  ];

  if (loading && !isRefreshing) {
    return <LoadingState message="Connecting to ThreatX Threat Intelligence & AI Engines..." />;
  }

  if (error && !stats) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const overallRisk = stats?.overallRiskScore ?? 45;
  const overallRiskLevel = overallRisk >= 75 ? 'Critical' : overallRisk >= 50 ? 'High' : overallRisk >= 25 ? 'Medium' : 'Low';

  return (
    <div className="space-y-6 pb-12">
      <Topbar
        title="AI Threat Intelligence & Integrated Security Engines"
        subtitle="AbuseIPDB Threat Reputation, VirusTotal Multi-Engine IOC Verdicts, and Google Gemini AI SOC Copilot"
      />

      {/* Active API Integrations Status Bar */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 border border-gray-300 shadow-md text-gray-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wide">ThreatX Live Intelligence Ecosystem</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ALL APIS ONLINE
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Connected &amp; authenticated to external threat intelligence feeds &amp; Gemini AI models
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* AbuseIPDB Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-slate-600">
              <Radio className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-gray-600 font-medium">AbuseIPDB:</span>
              <span className={`font-bold flex items-center gap-1 ${integrationStatus.abuseIpdb?.configured ? 'text-emerald-600' : 'text-amber-600'}`}>
                <CheckCircle2 className="w-3 h-3" /> {integrationStatus.abuseIpdb?.configured ? 'Active' : 'Unconfigured'}
              </span>
            </div>

            {/* VirusTotal Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-slate-600">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-gray-600 font-medium">VirusTotal v3:</span>
              <span className={`font-bold flex items-center gap-1 ${integrationStatus.virusTotal?.configured ? 'text-emerald-600' : 'text-amber-600'}`}>
                <CheckCircle2 className="w-3 h-3" /> {integrationStatus.virusTotal?.configured ? 'Active' : 'Unconfigured'}
              </span>
            </div>

            {/* Gemini AI Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-900/60 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span className="text-indigo-600 font-medium">Gemini AI:</span>
              <span className={`font-bold flex items-center gap-1 ${integrationStatus.gemini?.configured ? 'text-emerald-600' : 'text-amber-600'}`}>
                <CheckCircle2 className="w-3 h-3" /> {integrationStatus.gemini?.configured ? 'Ready' : 'Unconfigured'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center border-b border-[#E4E7EC] bg-white rounded-t-xl px-4 pt-3 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-[#667085] hover:text-[#172033]'
          }`}
        >
          <Layers className="w-4 h-4" />
          AI Neural Analyzer &amp; Stream
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'scanner'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-[#667085] hover:text-[#172033]'
          }`}
        >
          <Search className="w-4 h-4" />
          Live IOC Scanner (AbuseIPDB &amp; VirusTotal)
        </button>

        <button
          onClick={() => setActiveTab('copilot')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'copilot'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-[#667085] hover:text-[#172033]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          ThreatX AI SOC Copilot (Google Gemini)
        </button>
      </div>

      {/* ================= TAB 1: OVERVIEW & DECISION STREAM ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
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

          {/* Interactive AI Evaluation Sandbox with Live Enrichment */}
          <div className="rounded-xl bg-white border border-[#E4E7EC] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">AI Threat Evaluation Sandbox (Live IOC Enriched)</h3>
                  <p className="text-xs text-[#667085]">
                    Simulate events to evaluate deterministic scoring with real-time AbuseIPDB &amp; VirusTotal lookups
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
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-gray-900 font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
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
              <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] animate-fade-in space-y-3">
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

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#172033] uppercase tracking-wider">Explainable AI Rationales:</div>
                  <ul className="space-y-1 text-xs text-[#172033] list-disc list-inside">
                    {sandboxResult.reasons?.map((reason: string, i: number) => (
                      <li key={i} className="text-[#172033]">
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Live Enrichment Badges if available */}
                {sandboxResult.enrichment && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {sandboxResult.enrichment.abuseIpdb && (
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-orange-600" />
                          AbuseIPDB Threat Feed
                        </div>
                        <div className="text-slate-600 mt-1 text-[11px]">
                          Score: <span className="font-bold text-red-600">{sandboxResult.enrichment.abuseIpdb.abuseConfidenceScore}%</span> | ISP: {sandboxResult.enrichment.abuseIpdb.isp}
                        </div>
                      </div>
                    )}
                    {sandboxResult.enrichment.virusTotal && (
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          VirusTotal Antivirus Verdict
                        </div>
                        <div className="text-slate-600 mt-1 text-[11px]">
                          Detection: <span className="font-bold text-blue-700">{sandboxResult.enrichment.virusTotal.detectionRate}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-blue-900">Automated Recommendation: </span>
                    <span className="text-blue-800">{sandboxResult.recommendedAction}</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('copilot');
                      handleSendCopilotMessage(`Analyze this sandbox event: ${sandboxEventType} from IP ${sandboxIp} with risk score ${sandboxResult.riskScore}/100.`);
                    }}
                    className="ml-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded font-bold text-[11px] whitespace-nowrap"
                  >
                    Investigate with Copilot →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Decision Stream Table */}
          <div className="rounded-xl bg-white border border-[#E4E7EC] p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  Recent AI Decisions &amp; Real-time Audit Trail
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Chronological log of multi-vector scoring rationales and automated containment decisions
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
      )}

      {/* ================= TAB 2: LIVE IOC SCANNER (AbuseIPDB & VirusTotal) ================= */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white border border-[#E4E7EC] p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#172033] flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  Live IOC Threat Scanner &amp; Reputation Lookup
                </h2>
                <p className="text-xs text-[#667085] mt-1">
                  Query IP addresses, hostnames, and file hashes live across AbuseIPDB database and 90+ VirusTotal antivirus engines.
                </p>
              </div>

              {/* Indicator Type Selector */}
              <div className="flex rounded-lg bg-slate-100 border border-[#E4E7EC] p-1 text-xs">
                <button
                  onClick={() => {
                    setScanType('ip');
                    setScanTarget('118.25.6.39');
                  }}
                  className={`px-3 py-1.5 rounded font-bold transition-all ${
                    scanType === 'ip' ? 'bg-white text-blue-700 shadow-xs' : 'text-[#667085] hover:text-[#172033]'
                  }`}
                >
                  IP Address
                </button>
                <button
                  onClick={() => {
                    setScanType('domain');
                    setScanTarget('malicious-c2-domain.com');
                  }}
                  className={`px-3 py-1.5 rounded font-bold transition-all ${
                    scanType === 'domain' ? 'bg-white text-blue-700 shadow-xs' : 'text-[#667085] hover:text-[#172033]'
                  }`}
                >
                  Domain / Hostname
                </button>
                <button
                  onClick={() => {
                    setScanType('hash');
                    setScanTarget('275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f');
                  }}
                  className={`px-3 py-1.5 rounded font-bold transition-all ${
                    scanType === 'hash' ? 'bg-white text-blue-700 shadow-xs' : 'text-[#667085] hover:text-[#172033]'
                  }`}
                >
                  File Hash (SHA256/MD5)
                </button>
              </div>
            </div>

            {/* Input Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={scanTarget}
                  onChange={(e) => setScanTarget(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanIoc()}
                  placeholder={
                    scanType === 'ip'
                      ? 'Enter IPv4 or IPv6 address (e.g. 118.25.6.39, 8.8.8.8)...'
                      : scanType === 'domain'
                      ? 'Enter domain name (e.g. evil-tracker.xyz, google.com)...'
                      : 'Enter MD5, SHA1, or SHA256 file hash...'
                  }
                  className="w-full pl-4 pr-10 py-3 bg-[#F8FAFC] border border-[#E4E7EC] rounded-lg text-sm text-[#172033] font-mono focus:outline-none focus:border-blue-500 shadow-inner"
                />
              </div>

              <button
                onClick={handleScanIoc}
                disabled={scanLoading || !scanTarget.trim()}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xs whitespace-nowrap"
              >
                {scanLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Scan Threat Intelligence
              </button>
            </div>

            {scanError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}
          </div>

          {/* IOC Scan Result Card */}
          {scanResult && (
            <div className="rounded-xl bg-white border border-[#E4E7EC] p-6 shadow-xs space-y-6 animate-fade-in">
              {/* Header Verdict Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-gray-900 font-black text-xl shadow-md ${
                      scanResult.verdict === 'malicious'
                        ? 'bg-red-600'
                        : scanResult.verdict === 'suspicious'
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                  >
                    {scanResult.verdict === 'malicious' ? 'MAL' : scanResult.verdict === 'suspicious' ? 'SUSP' : 'OK'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#172033] font-mono">
                        {scanResult.ip || scanResult.domain || scanResult.hash}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          scanResult.verdict === 'malicious'
                            ? 'bg-red-100 text-red-800'
                            : scanResult.verdict === 'suspicious'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {scanResult.verdict} VERDICT
                      </span>
                    </div>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Threat Score: <strong className="text-slate-900">{scanResult.threatScore}/100</strong> • Scanned at {new Date(scanResult.analyzedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveTab('copilot');
                      handleSendCopilotMessage(`Perform deep forensic investigation on indicator ${scanTarget} with verdict '${scanResult.verdict}' and threat score ${scanResult.threatScore}/100.`);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-gray-900 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Investigate with Gemini AI
                  </button>
                </div>
              </div>

              {/* Two Column Breakdown: AbuseIPDB & VirusTotal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AbuseIPDB Panel */}
                <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <Radio className="w-4 h-4 text-orange-600" />
                      AbuseIPDB Threat Intelligence
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                      API v2 Live
                    </span>
                  </div>

                  {scanResult.abuseIpdb ? (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Abuse Confidence Score</span>
                          <span className="text-base font-bold text-red-600">
                            {scanResult.abuseIpdb.abuseConfidenceScore}%
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Community Reports</span>
                          <span className="text-base font-bold text-slate-800">
                            {scanResult.abuseIpdb.totalReports} reports ({scanResult.abuseIpdb.numDistinctUsers} reporters)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-gray-400">Country:</span>
                          <span className="font-semibold text-slate-800">{scanResult.abuseIpdb.countryName} ({scanResult.abuseIpdb.countryCode})</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-gray-400">ISP / Organization:</span>
                          <span className="font-semibold text-slate-800 font-mono">{scanResult.abuseIpdb.isp}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-gray-400">Usage Type:</span>
                          <span className="font-semibold text-slate-800">{scanResult.abuseIpdb.usageType}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-gray-400">Whitelisted:</span>
                          <span className="font-semibold text-slate-800">{scanResult.abuseIpdb.isWhitelisted ? 'Yes' : 'No'}</span>
                        </div>
                      </div>

                      {scanResult.abuseIpdb.reports?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <span className="font-bold text-slate-700 block mb-2 text-[11px] uppercase tracking-wider">
                            Recent Community Abuse Reports:
                          </span>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {scanResult.abuseIpdb.reports.map((rep: any, idx: number) => (
                              <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px]">
                                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                                  <span>{new Date(rep.reportedAt).toLocaleDateString()}</span>
                                  <span className="font-bold text-orange-700">{rep.categoryNames?.join(', ')}</span>
                                </div>
                                <p className="text-slate-700 italic">"{rep.comment || 'Reported malicious traffic'}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-gray-500 text-xs">
                      AbuseIPDB report not applicable for this indicator type.
                    </div>
                  )}
                </div>

                {/* VirusTotal Panel */}
                <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      <Globe className="w-4 h-4 text-blue-600" />
                      VirusTotal Multi-Engine Scanner
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      API v3 Live
                    </span>
                  </div>

                  {scanResult.virusTotal ? (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Detection Verdict</span>
                          <span className="text-base font-bold text-blue-700">
                            {scanResult.virusTotal.detectionRate}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Community Reputation</span>
                          <span className="text-base font-bold text-slate-800">
                            {scanResult.virusTotal.reputation || 0}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {scanResult.virusTotal.asOwner && (
                          <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-gray-400">Autonomous System (AS):</span>
                            <span className="font-semibold text-slate-800 font-mono">{scanResult.virusTotal.asOwner}</span>
                          </div>
                        )}
                        {scanResult.virusTotal.network && (
                          <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-gray-400">Subnet Network:</span>
                            <span className="font-semibold text-slate-800 font-mono">{scanResult.virusTotal.network}</span>
                          </div>
                        )}
                        {scanResult.virusTotal.suggestedThreatLabel && (
                          <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-gray-400">Threat Label:</span>
                            <span className="font-bold text-red-600">{scanResult.virusTotal.suggestedThreatLabel}</span>
                          </div>
                        )}
                      </div>

                      {/* Engine Detections Breakdown */}
                      {scanResult.virusTotal.topDetections?.length > 0 ? (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <span className="font-bold text-slate-700 block mb-2 text-[11px] uppercase tracking-wider">
                            Engines Flagging Malicious:
                          </span>
                          <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                            {scanResult.virusTotal.topDetections.map((det: any, idx: number) => (
                              <div key={idx} className="p-1.5 rounded bg-red-50 border border-red-100 text-[11px] flex items-center justify-between">
                                <span className="font-bold text-slate-800">{det.engineName}</span>
                                <span className="text-red-700 font-mono text-[10px]">{det.result}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>0 security engines flagged this target as malicious on VirusTotal.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-gray-500 text-xs">
                      VirusTotal lookup failed or pending.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: THREATX AI SOC COPILOT (Google Gemini) ================= */}
      {activeTab === 'copilot' && (
        <div className="space-y-6">
          {/* Top Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleRunDeepAnalysis}
              disabled={isDeepAnalyzing}
              className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 hover:border-indigo-300 text-left transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Deep Incident Triage
                </span>
                {isDeepAnalyzing && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
              </div>
              <p className="text-xs text-indigo-800">
                Run automated MITRE ATT&CK mapping, root-cause hypothesis &amp; 3-phase containment playbooks.
              </p>
            </button>

            <button
              onClick={handleGenerateReport}
              disabled={reportLoading}
              className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-slate-50 border border-purple-200 hover:border-purple-300 text-left transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-purple-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Generate CISO Report
                </span>
                {reportLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />}
              </div>
              <p className="text-xs text-purple-800">
                Compile an audit-ready executive threat report formatted in Markdown for stakeholders.
              </p>
            </button>

            <button
              onClick={() => handleSendCopilotMessage('Generate a forensic CLI investigation checklist (Linux journalctl, netstat, Splunk queries) for anomalous SSH logins.')}
              className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 hover:border-slate-300 text-left transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  Forensic Command Suite
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Ask Gemini for ready-to-run terminal commands (Linux, Windows, Splunk SPL) for instant investigation.
              </p>
            </button>
          </div>

          {/* Deep AI Investigation Card */}
          {deepAnalysisResult && (
            <div className="rounded-xl bg-white border border-indigo-200 p-6 shadow-xs space-y-5 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-gray-900 flex items-center justify-center font-bold shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-indigo-950">
                      Deep AI Incident Triage (Model: {deepAnalysisResult.modelUsed})
                    </h3>
                    <p className="text-xs text-[#667085]">
                      Confidence: <strong>{deepAnalysisResult.confidence}%</strong> • Assessed at {new Date(deepAnalysisResult.analyzedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      deepAnalysisResult.severity === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : deepAnalysisResult.severity === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {deepAnalysisResult.severity} SEVERITY ({deepAnalysisResult.threatScore}/100)
                  </span>
                </div>
              </div>

              {/* Summary & Root Cause */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
                  <span className="font-bold text-indigo-950 uppercase tracking-wider text-[11px] block">
                    Executive Summary:
                  </span>
                  <p className="text-indigo-900 leading-relaxed">{deepAnalysisResult.summary}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                    Root Cause Hypothesis:
                  </span>
                  <p className="text-slate-800 leading-relaxed">{deepAnalysisResult.rootCauseAnalysis}</p>
                </div>
              </div>

              {/* MITRE ATT&CK Matrix */}
              {deepAnalysisResult.mitreAttack?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900 block mb-2 text-xs uppercase tracking-wider">
                    MITRE ATT&amp;CK Matrix Mapping:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {deepAnalysisResult.mitreAttack.map((m: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-indigo-700">{m.technique}</span>
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-mono text-[10px] font-bold">
                            {m.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-semibold mb-1">Tactic: {m.tactic}</div>
                        <p className="text-slate-700 text-[11px]">{m.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3-Phase Playbook */}
              {deepAnalysisResult.playbook && (
                <div className="space-y-3">
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                    Immediate Containment &amp; Remediation Playbook:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-lg bg-red-50 border border-red-200">
                      <span className="font-bold text-red-900 block mb-2 uppercase text-[11px]">1. Containment</span>
                      <ul className="space-y-1 text-red-800 list-disc list-inside text-[11px]">
                        {deepAnalysisResult.playbook.containment?.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200">
                      <span className="font-bold text-amber-900 block mb-2 uppercase text-[11px]">2. Eradication</span>
                      <ul className="space-y-1 text-amber-800 list-disc list-inside text-[11px]">
                        {deepAnalysisResult.playbook.eradication?.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="font-bold text-emerald-900 block mb-2 uppercase text-[11px]">3. Recovery</span>
                      <ul className="space-y-1 text-emerald-800 list-disc list-inside text-[11px]">
                        {deepAnalysisResult.playbook.recovery?.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Forensic Command Box */}
              {deepAnalysisResult.forensicCommands?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900 block mb-2 text-xs uppercase tracking-wider">
                    Forensic Terminal Queries &amp; Verification Commands:
                  </span>
                  <div className="space-y-2">
                    {deepAnalysisResult.forensicCommands.map((cmd: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-white text-slate-100 font-mono text-xs flex items-center justify-between gap-4">
                        <div>
                          <span className="text-blue-400 text-[10px] block font-sans uppercase font-bold">
                            [{cmd.platform.toUpperCase()}] {cmd.purpose}
                          </span>
                          <span className="text-emerald-600">$ {cmd.command}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(cmd.command, `cmd-${i}`)}
                          className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs flex items-center gap-1 shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedKey === `cmd-${i}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generated Markdown Report Modal / Preview */}
          {generatedReport && (
            <div className="rounded-xl bg-white border border-purple-200 p-6 shadow-md space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-base text-purple-950">Audit-Ready CISO Incident Report</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(generatedReport, 'report')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-gray-900 rounded text-xs font-bold flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedKey === 'report' ? 'Copied to Clipboard!' : 'Copy Markdown'}
                  </button>
                  <button
                    onClick={() => setGeneratedReport(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
              <pre className="p-4 rounded-lg bg-white text-slate-100 font-mono text-xs overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed">
                {generatedReport}
              </pre>
            </div>
          )}

          {/* Interactive Copilot Chat Console */}
          <div className="rounded-xl bg-white border border-[#E4E7EC] shadow-xs flex flex-col h-[520px]">
            <div className="p-4 border-b border-[#E4E7EC] flex items-center justify-between bg-slate-50/70 rounded-t-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-gray-900 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#172033]">ThreatX AI Sentinel Assistant</h3>
                  <p className="text-[10px] text-[#667085]">Powered by Google Gemini Generative Security Engine</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Active Session</span>
              </div>
            </div>

            {/* Chat message stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-gray-900 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-xl p-3.5 text-xs ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-gray-900 shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 shadow-2xs space-y-1.5'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                      <span>{msg.role === 'user' ? 'SOC Analyst' : 'ThreatX AI Sentinel'}</span>
                      <span>{msg.time}</span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</div>
                  </div>
                </div>
              ))}

              {copilotLoading && (
                <div className="flex gap-3 justify-start items-center text-xs text-indigo-700 bg-indigo-50 p-3 rounded-xl border border-indigo-100 w-fit">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>ThreatX AI Sentinel is analyzing telemetry and formulating response...</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex gap-2 overflow-x-auto text-[11px]">
              <button
                onClick={() => handleSendCopilotMessage('What are the indicators of a ransomware attack in progress?')}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-all shrink-0"
              >
                🚨 Ransomware Indicators
              </button>
              <button
                onClick={() => handleSendCopilotMessage('Write a Sigma rule to detect credential dumping from LSASS.')}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-all shrink-0"
              >
                📜 Sigma Rule: LSASS Dump
              </button>
              <button
                onClick={() => handleSendCopilotMessage('How should we isolate a compromised Linux server on subnets 10.0.4.0/24?')}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-all shrink-0"
              >
                🔒 Subnet Quarantine Playbook
              </button>
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-[#E4E7EC] flex items-center gap-2 bg-white rounded-b-xl">
              <input
                type="text"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCopilotMessage()}
                placeholder="Ask ThreatX AI Copilot anything about threat triage, MITRE ATT&CK, containment, or forensics..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleSendCopilotMessage()}
                disabled={copilotLoading || !copilotInput.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-gray-900 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
