import { useEffect, useState, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldX,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import ThreatTable from '../components/ThreatTable';
import ThreatActivityChart from '../components/ThreatActivityChart';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../services/api';
import { subscribeToThreats, subscribeToThreatUpdates } from '../services/socket';
import type { ThreatEvent } from '../types';

export default function Threats() {
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadThreats = useCallback(async () => {
    try {
      const data = await api.getEvents({ limit: 100 });
      setThreats(data || []);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load threat events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreats();

    const unsubNew = subscribeToThreats((newThreat) => {
      setThreats((prev) => [
        newThreat,
        ...prev.filter((t) => (t.threatId || t.id) !== (newThreat.threatId || newThreat.id)),
      ]);
    });

    const unsubUpdate = subscribeToThreatUpdates((updated) => {
      setThreats((prev) =>
        prev.map((t) => ((t.threatId || t.id) === (updated.threatId || updated.id) ? updated : t))
      );
    });

    const interval = setInterval(loadThreats, 15000);

    return () => {
      clearInterval(interval);
      unsubNew();
      unsubUpdate();
    };
  }, [loadThreats]);

  const handleAcknowledge = async (id: string) => {
    await api.acknowledgeEvent(id);
    setThreats((prev) =>
      prev.map((t) => (t.id === id || t.threatId === id ? { ...t, acknowledged: true, status: 'mitigated' } : t))
    );
  };

  const handleThreatUpdated = (updated: ThreatEvent) => {
    setThreats((prev) =>
      prev.map((t) => ((t.threatId || t.id) === (updated.threatId || updated.id) ? updated : t))
    );
  };

  if (loading && threats.length === 0) {
    return (
      <div className="space-y-6">
        <Topbar title="Threat Intelligence & Detection" subtitle="Connecting to ThreatX Security Engine..." />
        <LoadingState />
      </div>
    );
  }

  if (error && threats.length === 0) {
    return (
      <div className="space-y-6">
        <Topbar title="Threat Intelligence & Detection" connectionStatus="offline" />
        <ErrorState message={error} onRetry={loadThreats} />
      </div>
    );
  }

  const criticalThreats = threats.filter(
    (t) => (t.severity || t.riskLevel || '').toLowerCase() === 'critical'
  ).length;
  const highThreats = threats.filter(
    (t) => (t.severity || t.riskLevel || '').toLowerCase() === 'high'
  ).length;
  const mediumThreats = threats.filter(
    (t) => (t.severity || t.riskLevel || '').toLowerCase() === 'medium'
  ).length;
  const mitigatedThreats = threats.filter(
    (t) => t.status === 'mitigated' || t.acknowledged
  ).length;

  return (
    <div className="space-y-6">
      <Topbar
        title="Threat Intelligence & Detection"
        subtitle="Active attack signatures, anomaly triage and automated mitigation controls"
      />

      {/* Stats Summary - 4 Core Risk Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Intercepted"
          value={threats.length}
          icon={ShieldAlert}
          accent="red"
          trend="Real-time Stream"
          trendDirection="up"
        />
        <StatCard
          title="Critical / High Risk"
          value={criticalThreats + highThreats}
          icon={ShieldX}
          accent="red"
          trend="Immediate Triage"
          trendDirection="up"
        />
        <StatCard
          title="Medium Risk Vectors"
          value={mediumThreats}
          icon={Filter}
          accent="amber"
          trend="Under Investigation"
          trendDirection="neutral"
        />
        <StatCard
          title="Mitigated Threats"
          value={mitigatedThreats}
          icon={CheckCircle2}
          accent="green"
          trend="Contained"
          trendDirection="down"
        />
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 gap-6">
        <ThreatActivityChart liveCount={threats.length} />
      </div>

      {/* Threat List Table with pagination and investigation modal */}
      <ThreatTable
        threats={threats}
        onAcknowledge={handleAcknowledge}
        onThreatUpdated={handleThreatUpdated}
        pageSize={12}
      />
    </div>
  );
}
