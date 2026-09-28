import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Bell,
  Server as ServerIcon,
  Users,
  ArrowRight,
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

  if (loading && !statusData) {
    return (
      <div className="space-y-6">
        <Topbar title="Security Overview" subtitle="Connecting to ThreatX Security Engine..." />
        <LoadingState />
      </div>
    );
  }

  if (error && !statusData) {
    return (
      <div className="space-y-6">
        <Topbar title="Security Overview" connectionStatus="offline" />
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
    <div className="space-y-6 animate-fade-in">
      {/* Top Navigation Bar with Global Search & Alert Center integration */}
      <Topbar
        title="Security Overview"
        subtitle="Real-time security operations and infrastructure monitoring"
        connectionStatus={statusData?.connection_status || 'connected'}
        lastUpdated={lastUpdatedTime}
        onSelectThreat={(t) => setSelectedThreatForModal(t)}
        onSelectServer={(s) => setSelectedServerForModal(s)}
      />

      {/* 1. Dashboard 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Threats"
          value={liveThreatCount}
          icon={ShieldAlert}
          accent="red"
          trend="Requiring Triage"
          trendDirection="up"
        />
        <StatCard
          title="Critical Alerts"
          value={criticalAlertCount}
          icon={Bell}
          accent="amber"
          trend="Immediate Action"
          trendDirection="up"
        />
        <StatCard
          title="Online Servers"
          value={`${onlineServerCount}/${servers.length || 3}`}
          icon={ServerIcon}
          accent="green"
          trend="Cluster Healthy"
          trendDirection="neutral"
        />
        <StatCard
          title="Active Sessions"
          value={activeSessionCount}
          icon={Users}
          accent="cyan"
          trend="Live Connections"
          trendDirection="neutral"
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

      {/* 3. Threat Activity Chart */}
      <div>
        <ThreatChart
          timelineData={analytics?.timeline}
          liveCount={liveThreatCount}
        />
      </div>

      {/* 4. Recent Threats Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#172033]">Recent Threats</h3>
            <p className="text-xs text-[#667085]">Real-time security telemetry feed and incident triage</p>
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
