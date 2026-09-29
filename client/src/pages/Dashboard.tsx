import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Bell,
  Server as ServerIcon,
  Users,
  ArrowRight,
  Sparkles,
  Search,
  Zap,
  Play,
  Send,
  Terminal,
  RefreshCw,
  BrainCircuit,
  Lock,
} from 'lucide-react';

import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import ServerHealth from '../components/ServerHealth';
import ThreatChart from '../components/ThreatChart';
import ThreatTable from '../components/ThreatTable';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import SecurityPosturePanel from '../components/SecurityPosturePanel';
import DemoScenarioModal from '../components/DemoScenarioModal';
import NotificationToastContainer, { type ToastNotification } from '../components/NotificationToast';
import ThreatInvestigationModal from '../components/ThreatInvestigationModal';
import ServerDrilldownModal from '../components/ServerDrilldownModal';
import Button from '../components/ui/Button';
import { api, type SystemStatusData, type AnalyticsData } from '../services/api';
import {
  subscribeToTelemetry,
  subscribeToThreats,
  subscribeToThreatUpdates,
  subscribeToAlerts,
  subscribeToAlertUpdates,
  subscribeToIntelligence,
} from '../services/socket';
import type { ThreatEvent, Server, Alert } from '../types';

export default function Dashboard() {
  const [statusData, setStatusData] = useState<SystemStatusData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const [selectedThreatForModal, setSelectedThreatForModal] = useState<ThreatEvent | null>(null);
  const [selectedServerForModal, setSelectedServerForModal] = useState<Server | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  // Live IOC Quick-Scanner state
  const [quickScanTarget, setQuickScanTarget] = useState('118.25.6.39');
  const [quickScanType, setQuickScanType] = useState<'ip' | 'domain' | 'hash'>('ip');
  const [quickScanLoading, setQuickScanLoading] = useState(false);
  const [quickScanResult, setQuickScanResult] = useState<any>(null);
  const [quickScanError, setQuickScanError] = useState<string | null>(null);

  // Gemini AI SOC Copilot state
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResponse, setCopilotResponse] = useState<string | null>(
    'ThreatX AI Sentinel online. Google Gemini is actively monitoring incoming anomaly vectors and MITRE ATT&CK patterns.'
  );

  // Quick Simulation Action status
  const [simulatingAction, setSimulatingAction] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const navigate = useNavigate();

  const fetchStatusAndData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setError(null);
    }

    try {
      // 1. Fetch system status from GET /api/status
      const liveStatus = await api.getStatus();
      if (!isMountedRef.current) return;
      setStatusData(liveStatus);

      // 2. Fetch dashboard resources in parallel
      const [analyticsData, threatEvents, srvList, alertList] = await Promise.all([
        api.getAnalytics().catch(() => null),
        api.getEvents({ limit: 20 }),
        api.getServers(),
        api.getAlerts(),
      ]);

      if (!isMountedRef.current) return;
      if (analyticsData) setAnalytics(analyticsData);
      setThreats(threatEvents);
      setServers(srvList);
      setAlerts(alertList);
      setError(null);
      setLastUpdatedTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.warn('Live API telemetry sync note:', err.message);

      if (!statusData) {
        setError(err.message || 'Unable to connect to ThreatX API or Demo Server');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRetrying(false);
      }
    }
  }, [statusData]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStatusAndData(true);

    // Real-time Socket.IO Subscriptions
    const unsubTelemetry = subscribeToTelemetry((telemetry) => {
      if (!isMountedRef.current) return;
      setStatusData(telemetry);
      setLastUpdatedTime(new Date().toLocaleTimeString());
    });

    const unsubThreats = subscribeToThreats((newThreat) => {
      if (!isMountedRef.current) return;
      setThreats((prev) => [
        newThreat,
        ...prev.filter((t) => (t.threatId || t.id) !== (newThreat.threatId || newThreat.id)).slice(0, 19),
      ]);

      const toastId = `toast-${Date.now()}-${Math.random()}`;
      const sev = (newThreat.severity || newThreat.riskLevel || 'high').toLowerCase() as any;
      setNotifications((prev) => [
        {
          id: toastId,
          threat: newThreat,
          title: `${newThreat.type || newThreat.threatType || 'Security Anomaly'} Intercepted`,
          severity: sev,
          source: newThreat.source || newThreat.ipAddress,
          target: newThreat.target || 'SRV-001',
          timestamp: newThreat.detectedAt || new Date(),
        },
        ...prev.slice(0, 3),
      ]);
    });

    const unsubThreatUpdates = subscribeToThreatUpdates((updated) => {
      if (!isMountedRef.current) return;
      setThreats((prev) =>
        prev.map((t) => ((t.threatId || t.id) === (updated.threatId || updated.id) ? updated : t))
      );
    });

    const unsubAlerts = subscribeToAlerts((newAlert) => {
      if (!isMountedRef.current) return;
      setAlerts((prev) => [
        newAlert,
        ...prev.filter((a) => (a.alertId || a.id) !== (newAlert.alertId || newAlert.id)),
      ]);
    });

    const unsubAlertUpdates = subscribeToAlertUpdates((updated) => {
      if (!isMountedRef.current) return;
      setAlerts((prev) =>
        prev.map((a) => ((a.alertId || a.id) === (updated.alertId || updated.id) ? updated : a))
      );
    });

    const unsubIntelligence = subscribeToIntelligence((data) => {
      if (!isMountedRef.current || !data) return;
      const isCrit = data.analysis?.riskLevel === 'critical';
      const isHigh = data.analysis?.riskLevel === 'high';
      if (isCrit || isHigh) {
        setNotifications((prev) => [
          {
            id: `intel-${Date.now()}-${Math.random()}`,
            title: `AI Intelligence: ${data.analysis?.riskLevel?.toUpperCase()} Risk Detected`,
            type: data.event?.event_type || 'Anomaly Detection',
            severity: isCrit ? 'critical' : 'high',
            source: data.event?.source_ip || '127.0.0.1',
            target: data.threat?.target || 'SRV-001',
            timestamp: new Date(),
            threat: data.threat,
          },
          ...prev.slice(0, 3),
        ]);
      }
    });

    // Fallback sync polling every 6s
    const interval = setInterval(() => {
      fetchStatusAndData(false);
    }, 6000);

    return () => {
      isMountedRef.current = false;
      unsubTelemetry();
      unsubThreats();
      unsubThreatUpdates();
      unsubAlerts();
      unsubAlertUpdates();
      unsubIntelligence();
      clearInterval(interval);
    };
  }, [fetchStatusAndData]);

  const handleRetry = () => {
    setIsRetrying(true);
    fetchStatusAndData(true);
  };

  const handleAcknowledge = async (id: string) => {
    await api.acknowledgeEvent(id);
    setThreats((prev) =>
      prev.map((t) => (t.id === id || t.threatId === id ? { ...t, acknowledged: true, status: 'mitigated' } : t))
    );
  };

  const handleBlockIp = async (ip: string) => {
    console.log(`[SOC Perimeter] Source IP subnet neutralized: ${ip}`);
  };

  const dismissToast = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Quick IOC Scanner Handler
  const handleQuickScan = async (target?: string, type?: 'ip' | 'domain' | 'hash') => {
    const val = (target || quickScanTarget).trim();
    const stype = type || quickScanType;
    if (!val) return;

    setQuickScanLoading(true);
    setQuickScanError(null);
    setQuickScanResult(null);

    try {
      let res: any;
      if (stype === 'ip') {
        res = await api.lookupIp(val);
      } else if (stype === 'domain') {
        res = await api.lookupDomain(val);
      } else {
        res = await api.lookupHash(val);
      }
      setQuickScanResult(res);
    } catch (err: any) {
      setQuickScanError(err.response?.data?.error || err.message || 'IOC scan failed');
    } finally {
      setQuickScanLoading(false);
    }
  };

  // Gemini AI Copilot Query Handler
  const handleAskCopilot = async (customPrompt?: string) => {
    const prompt = customPrompt || copilotInput;
    if (!prompt.trim() || copilotLoading) return;

    setCopilotLoading(true);
    setCopilotInput('');

    try {
      const res = await api.copilotChat(
        prompt,
        {
          activeThreatCount: threats.length,
          topThreats: threats.slice(0, 5),
          lastScan: quickScanResult,
        },
        []
      );
      setCopilotResponse(res.reply || 'Analysis completed successfully.');
    } catch (err: any) {
      setCopilotResponse(`⚠️ AI Triage Error: ${err.response?.data?.message || err.message || 'Service unreachable'}`);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Quick Demo Trigger
  const handleTriggerQuickScenario = async (type: string) => {
    setSimulatingAction(type);
    try {
      await api.triggerScenario(type);
      setTimeout(() => {
        fetchStatusAndData(false);
        setSimulatingAction(null);
      }, 800);
    } catch (err) {
      setSimulatingAction(null);
    }
  };

  if (loading && !statusData) {
    return (
      <div className="space-y-6">
        <Topbar title="Security Operations Center" subtitle="Connecting to ThreatX Security Engine..." />
        <LoadingState />
      </div>
    );
  }

  if (error && !statusData) {
    return (
      <div className="space-y-6">
        <Topbar title="Security Operations Center" connectionStatus="offline" />
        <ErrorState
          title="Telemetry Gateway Unavailable"
          message="Could not reach the ThreatX central API or Python simulation server. Verify services are running on ports 3001 and 5001."
          onRetry={handleRetry}
          isRetrying={isRetrying}
        />
      </div>
    );
  }

  // Real-time metric computations from actual backend data
  const liveThreatCount = analytics?.activeThreats ?? threats.filter((t) => !t.acknowledged && t.status !== 'mitigated').length;
  const criticalAlertCount =
    analytics?.criticalAlerts ?? alerts.filter((a) => (a.severity || a.riskLevel || '').toLowerCase() === 'critical' && a.status !== 'resolved').length;
  const onlineServerCount = analytics?.onlineServers ?? servers.filter((s) => s.status === 'online').length;
  const activeSessionCount = analytics?.activeSessions ?? statusData?.active_session_count ?? 4;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Command Bar */}
      <Topbar
        title="SOC Command Center"
        subtitle="Real-time multi-vector threat detection, external IOC intelligence, and Gemini AI triage"
        connectionStatus={statusData?.connection_status || 'connected'}
        lastUpdated={lastUpdatedTime}
        onSelectThreat={(t) => setSelectedThreatForModal(t)}
        onSelectServer={(s) => setSelectedServerForModal(s)}
      />

      {/* Hero Intelligence Status Banner with Quick Simulation Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1B2A4A] via-[#1E3A5F] to-[#1B2A4A] border border-blue-200/20 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-gray-900 shadow-lg shrink-0">
              <BrainCircuit className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-gray-900 tracking-wide">
                  ThreatX Live Intelligence Ecosystem
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ACTIVE ZERO-LATENCY BUS
                </span>
              </div>
              <p className="text-xs text-blue-200/70 mt-0.5">
                Real-time correlation across AbuseIPDB v2, VirusTotal Multi-Engine verdicts, and Google Gemini AI SOC Sentinel
              </p>
            </div>
          </div>

          {/* Quick Scenario Launch Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200/60 mr-1 hidden sm:inline">
              Simulate:
            </span>
            <button
              onClick={() => handleTriggerQuickScenario('brute_force')}
              disabled={Boolean(simulatingAction)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-50 border border-white/15 hover:border-rose-400/40 text-blue-100 hover:text-rose-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap size={13} className="text-rose-600" />
              <span>SSH Brute Force</span>
            </button>
            <button
              onClick={() => handleTriggerQuickScenario('privilege_escalation')}
              disabled={Boolean(simulatingAction)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-amber-500/20 border border-white/15 hover:border-amber-400/40 text-blue-100 hover:text-amber-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Lock size={13} className="text-amber-600" />
              <span>Root Escalation</span>
            </button>
            <button
              onClick={() => handleTriggerQuickScenario('sql_injection')}
              disabled={Boolean(simulatingAction)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-blue-50 border border-white/15 hover:border-blue-400/40 text-blue-100 hover:text-cyan-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Terminal size={13} className="text-blue-500" />
              <span>SQL Injection</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Dashboard 4 Primary Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Threats"
          value={liveThreatCount}
          icon={ShieldAlert}
          accent="red"
          trend="Requiring Triage"
          trendDirection="up"
          onClick={() => navigate('/threats')}
        />
        <StatCard
          title="Critical Alerts"
          value={criticalAlertCount}
          icon={Bell}
          accent="amber"
          trend="Immediate Action"
          trendDirection="up"
          onClick={() => navigate('/alerts')}
        />
        <StatCard
          title="Monitored Nodes"
          value={`${onlineServerCount}/${servers.length || 3}`}
          icon={ServerIcon}
          accent="green"
          trend="Cluster Healthy"
          trendDirection="neutral"
          onClick={() => navigate('/servers')}
        />
        <StatCard
          title="Active Sessions"
          value={activeSessionCount}
          icon={Users}
          accent="cyan"
          trend="Live Connections"
          trendDirection="neutral"
          onClick={() => navigate('/sessions')}
        />
      </div>

      {/* 2. Security Posture & Server Health Side-by-Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <SecurityPosturePanel
          threats={threats}
          alerts={alerts}
          servers={servers}
          statusData={statusData}
          onOpenDemoScenarios={() => setShowDemoModal(true)}
          onNavigateToIntelligence={() => navigate('/intelligence')}
        />

        <ServerHealth
          statusData={statusData}
          servers={servers}
          onRefresh={() => fetchStatusAndData(false)}
          isRefreshing={loading}
        />
      </div>

      {/* 3. Live IOC Intelligence Scanner & Gemini AI Copilot (Side-by-Side Command Center) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live IOC Quick Scanner (AbuseIPDB & VirusTotal) */}
        <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                  <Search size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 tracking-wide uppercase flex items-center gap-2">
                    Live IOC Scanner
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 border border-blue-200 font-mono">
                      AbuseIPDB + VT
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">Instant multi-engine reputation check</p>
                </div>
              </div>

              <div className="flex gap-1.5">
                {(['ip', 'domain', 'hash'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setQuickScanType(t);
                      if (t === 'ip') setQuickScanTarget('118.25.6.39');
                      if (t === 'domain') setQuickScanTarget('google.com');
                      if (t === 'hash') setQuickScanTarget('44d88612fea8a8f36de82e1278abb02f');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${
                      quickScanType === t
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 bg-gray-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Input & Quick Chips */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickScanTarget}
                  onChange={(e) => setQuickScanTarget(e.target.value)}
                  placeholder="Enter IP, domain, or SHA256 hash..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 font-mono focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickScan()}
                />
                <button
                  onClick={() => handleQuickScan()}
                  disabled={quickScanLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-gray-900 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {quickScanLoading ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                  <span>Scan</span>
                </button>
              </div>

              {/* Sample Quick Test Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                <span className="text-[10px] uppercase font-bold text-gray-400">Quick Test:</span>
                <button
                  type="button"
                  onClick={() => {
                    setQuickScanType('ip');
                    setQuickScanTarget('185.220.101.5');
                    handleQuickScan('185.220.101.5', 'ip');
                  }}
                  className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-mono text-[10px] border border-blue-200 cursor-pointer"
                >
                  185.220.101.5 (Tor Exit)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickScanType('ip');
                    setQuickScanTarget('118.25.6.39');
                    handleQuickScan('118.25.6.39', 'ip');
                  }}
                  className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-mono text-[10px] border border-rose-200 cursor-pointer"
                >
                  118.25.6.39 (Brute Force)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickScanType('domain');
                    setQuickScanTarget('google.com');
                    handleQuickScan('google.com', 'domain');
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-mono text-[10px] border border-emerald-200 cursor-pointer"
                >
                  google.com (Clean)
                </button>
              </div>
            </div>

            {/* Quick Result Box */}
            {quickScanResult && (
              <div className="mt-4 p-3.5 rounded-xl bg-gray-50 border border-gray-200 animate-fade-in space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-700 font-bold">{quickScanResult.target || quickScanTarget}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        quickScanResult.verdict === 'MALICIOUS' || quickScanResult.abuseConfidenceScore > 50
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : quickScanResult.verdict === 'CLEAN'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {quickScanResult.verdict || (quickScanResult.abuseConfidenceScore > 50 ? 'MALICIOUS' : 'BENIGN')}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono">{quickScanResult.countryCode || 'GLOBAL'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {quickScanResult.abuseConfidenceScore !== undefined && (
                    <div className="p-2 rounded-lg bg-white border border-gray-200">
                      <span className="text-gray-500 block text-[10px]">Abuse Confidence:</span>
                      <span className="font-bold text-rose-600 font-mono text-xs">
                        {quickScanResult.abuseConfidenceScore}% ({quickScanResult.totalReports || 0} reports)
                      </span>
                    </div>
                  )}
                  {quickScanResult.maliciousEngines !== undefined && (
                    <div className="p-2 rounded-lg bg-white border border-gray-200">
                      <span className="text-gray-500 block text-[10px]">VirusTotal AV Hits:</span>
                      <span className="font-bold text-blue-700 font-mono text-xs">
                        {quickScanResult.maliciousEngines} / {quickScanResult.totalEngines || 90} Engines
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {quickScanError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {quickScanError}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Powered by AbuseIPDB &amp; VirusTotal v3 API</span>
            <button
              onClick={() => navigate('/intelligence')}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Full Scanner →
            </button>
          </div>
        </div>

        {/* Gemini AI SOC Copilot Quick Widget */}
        <div className="rounded-2xl bg-gradient-to-br from-[#1B2A4A] via-[#1E3060] to-[#1B2A4A] border border-blue-300/20 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-400/30 text-indigo-600">
                  <Sparkles size={16} className="animate-spin" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 tracking-wide uppercase flex items-center gap-2">
                    Gemini AI SOC Copilot
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 font-mono">
                      v2.5 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-blue-200/60">Autonomous threat triage &amp; playbook generator</p>
                </div>
              </div>

              <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE
              </span>
            </div>

            {/* Quick Prompt Prompts */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <button
                onClick={() => handleAskCopilot('Triage the current top active threats and prioritize immediate analyst actions.')}
                className="px-2.5 py-1 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 text-blue-100 text-xs font-semibold transition-all cursor-pointer"
              >
                ⚡ Triage Live Threats
              </button>
              <button
                onClick={() => handleAskCopilot('Generate MITRE ATT&CK containment steps for SSH Brute Force attacks.')}
                className="px-2.5 py-1 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 text-blue-100 text-xs font-semibold transition-all cursor-pointer"
              >
                🛡️ MITRE Mitigation
              </button>
              <button
                onClick={() => handleAskCopilot('Draft executive summary of current cluster security status and risk posture.')}
                className="px-2.5 py-1 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 text-blue-100 text-xs font-semibold transition-all cursor-pointer"
              >
                📄 Executive Summary
              </button>
            </div>

            {/* Copilot Response Box */}
            <div className="mt-4 p-3.5 rounded-xl bg-black/20 border border-white/10 text-xs text-blue-100 leading-relaxed font-sans min-h-[90px] max-h-[140px] overflow-y-auto">
              {copilotLoading ? (
                <div className="flex items-center gap-2 text-indigo-600 py-3">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Gemini AI is generating security insights...</span>
                </div>
              ) : (
                <p className="whitespace-pre-line">{copilotResponse}</p>
              )}
            </div>

            {/* Chat Input */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                placeholder="Ask Gemini AI (e.g. How to isolate compromised host?)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-gray-900 placeholder:text-blue-200/40 focus:outline-none focus:border-indigo-400 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAskCopilot()}
              />
              <button
                onClick={() => handleAskCopilot()}
                disabled={copilotLoading}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-gray-900 text-xs font-semibold transition-all flex items-center gap-1 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Send size={13} />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-blue-200/50">
            <span>Integrated with Google Gemini AI API</span>
            <button
              onClick={() => navigate('/intelligence')}
              className="text-indigo-600 hover:text-indigo-600 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Full AI Studio →
            </button>
          </div>
        </div>
      </div>

      {/* 4. Threat Activity Chart */}
      <div>
        <ThreatChart
          timelineData={analytics?.timeline}
          liveCount={liveThreatCount}
        />
      </div>

      {/* 5. Recent Threats Table & Live Incident Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Live Threat Triage Feed</h3>
            <p className="text-xs text-gray-500">Real-time security telemetry stream and perimeter incident response</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowRight size={13} />}
            iconPosition="right"
            onClick={() => navigate('/threats')}
          >
            View All
          </Button>
        </div>

        <ThreatTable
          threats={threats}
          onAcknowledge={handleAcknowledge}
          onBlockIp={handleBlockIp}
          onThreatUpdated={(updated) => {
            setThreats((prev) =>
              prev.map((t) => ((t.threatId || t.id) === (updated.threatId || updated.id) ? updated : t))
            );
          }}
        />
      </div>

      {/* Real-time Floating Toast Notifications */}
      <NotificationToastContainer
        notifications={notifications}
        onDismiss={dismissToast}
        onInvestigate={(threat) => setSelectedThreatForModal(threat)}
      />

      {/* Modals for Quick Details */}
      <ThreatInvestigationModal
        threat={selectedThreatForModal}
        onClose={() => setSelectedThreatForModal(null)}
        onThreatUpdated={(updated) => {
          setThreats((prev) =>
            prev.map((t) => ((t.threatId || t.id) === (updated.threatId || updated.id) ? updated : t))
          );
          setSelectedThreatForModal(updated);
        }}
      />

      <ServerDrilldownModal
        server={selectedServerForModal}
        onClose={() => setSelectedServerForModal(null)}
      />

      {/* Demo Scenario Controller Modal */}
      <DemoScenarioModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />
    </div>
  );
}
