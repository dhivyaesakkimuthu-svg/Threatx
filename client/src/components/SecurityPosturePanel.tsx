import { ShieldCheck, ShieldAlert, AlertTriangle, Activity, BrainCircuit, ArrowUpRight, Cpu } from 'lucide-react';
import type { ThreatEvent, Alert, Server } from '../types';
import type { SystemStatusData } from '../services/api';

interface SecurityPosturePanelProps {
  threats: ThreatEvent[];
  alerts: Alert[];
  servers: Server[];
  statusData?: SystemStatusData | null;
  onOpenDemoScenarios?: () => void;
  onNavigateToIntelligence?: () => void;
}

export default function SecurityPosturePanel({
  threats,
  alerts,
  servers,
  statusData,
  onOpenDemoScenarios,
  onNavigateToIntelligence,
}: SecurityPosturePanelProps) {
  // 1. Calculate actual real-time posture metrics from live data
  const activeThreats = threats.filter((t) => !t.acknowledged && t.status !== 'mitigated' && t.status !== 'blocked');
  const criticalThreats = activeThreats.filter((t) => (t.severity || t.riskLevel || '').toLowerCase() === 'critical');
  const highThreats = activeThreats.filter((t) => (t.severity || t.riskLevel || '').toLowerCase() === 'high');
  const mediumThreats = activeThreats.filter((t) => (t.severity || t.riskLevel || '').toLowerCase() === 'medium');

  const openAlerts = alerts.filter((a) => a.status === 'open' || a.status === 'investigating');
  const criticalAlerts = openAlerts.filter((a) => (a.severity || '').toLowerCase() === 'critical');

  // Calculate composite risk score (0-100)
  let maxThreatScore = 0;
  threats.forEach((t) => {
    const s = t.riskScore || (t.severity === 'critical' ? 95 : t.severity === 'high' ? 80 : t.severity === 'medium' ? 55 : 20);
    if (s > maxThreatScore) maxThreatScore = s;
  });

  const rawRiskScore = maxThreatScore > 0 
    ? maxThreatScore 
    : criticalAlerts.length > 0 
    ? 90 
    : openAlerts.length > 0 
    ? 65 
    : 15;

  const riskScore = Math.min(100, Math.max(0, rawRiskScore));

  // 2. Derive Posture State strictly from actual threat data
  let postureState: 'CRITICAL' | 'HIGH RISK' | 'ELEVATED' | 'NORMAL' = 'NORMAL';
  let badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-500/30';
  let borderLeft = 'border-l-4 border-l-emerald-500';
  let postureDescription = 'Perimeter nominal. Baseline operations verified across all monitored nodes.';

  if (criticalThreats.length > 0 || riskScore >= 85) {
    postureState = 'CRITICAL';
    badgeStyle = 'bg-rose-50 text-rose-600 border-rose-500/40 animate-pulse';
    borderLeft = 'border-l-4 border-l-rose-500 shadow-sm';
    postureDescription = `Active critical intrusion detected (${criticalThreats[0]?.type || 'High-Risk Vector'}). Immediate containment required.`;
  } else if (highThreats.length > 0 || riskScore >= 70) {
    postureState = 'HIGH RISK';
    badgeStyle = 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    borderLeft = 'border-l-4 border-l-orange-500';
    postureDescription = `Elevated authentication and access anomalies detected (${highThreats[0]?.type || 'Access Violation'}). Triage in progress.`;
  } else if (mediumThreats.length > 0 || openAlerts.length > 0 || riskScore >= 40) {
    postureState = 'ELEVATED';
    badgeStyle = 'bg-amber-500/20 text-amber-600 border-amber-500/40';
    borderLeft = 'border-l-4 border-l-amber-500';
    postureDescription = 'Non-critical telemetry spikes and port reconnaissance under active monitoring.';
  }

  const onlineServers = servers.filter((s) => s.status === 'online').length;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white  border border-gray-200 ${borderLeft} p-5 shadow-xl transition-all duration-200`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        {/* Left Posture Indicator */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-gray-500">
              Enterprise SOC Posture:
            </span>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold tracking-wide border uppercase ${badgeStyle}`}>
              {postureState}
            </span>
          </div>

          <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {postureState === 'NORMAL' && <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />}
            {postureState === 'ELEVATED' && <Activity className="w-5 h-5 text-amber-600 shrink-0" />}
            {postureState === 'HIGH RISK' && <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />}
            {postureState === 'CRITICAL' && <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>{postureDescription}</span>
          </h2>

          <p className="text-xs text-gray-500 leading-relaxed">
            Multi-factor telemetry analysis evaluating IP velocity, authentication frequencies, server load, and MITRE vector classifications in real time.
          </p>
        </div>

        {/* Center/Right Metrics & Controls */}
        <div className="flex flex-wrap items-center gap-3.5 sm:gap-5 bg-gray-50 border border-gray-200 p-3 rounded-xl">
          {/* Risk Score Gauge */}
          <div className="text-center min-w-[65px]">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">
              Risk Index
            </span>
            <span className={`text-xl font-bold font-mono ${
              riskScore >= 80 ? 'text-rose-600' : riskScore >= 50 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {riskScore}
              <span className="text-xs text-gray-400 font-normal">/100</span>
            </span>
          </div>

          <div className="h-8 w-px bg-gray-100 hidden sm:block" />

          {/* Critical Threats */}
          <div className="text-center min-w-[55px]">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">
              Critical
            </span>
            <span className={`text-lg font-bold font-mono ${criticalThreats.length > 0 ? 'text-rose-600 animate-pulse' : 'text-gray-600'}`}>
              {criticalThreats.length}
            </span>
          </div>

          {/* Open Alerts */}
          <div className="text-center min-w-[55px]">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">
              Alerts
            </span>
            <span className={`text-lg font-bold font-mono ${openAlerts.length > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
              {openAlerts.length}
            </span>
          </div>

          {/* Cluster Status */}
          <div className="text-center min-w-[60px] hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">
              Nodes
            </span>
            <span className="text-lg font-bold font-mono text-emerald-600">
              {onlineServers}/{servers.length || 3}
            </span>
          </div>

          {/* Live Node Telemetry */}
          {statusData && (
            <div className="text-center min-w-[65px] hidden md:block">
              <span className="text-[10px] uppercase font-bold text-gray-500 block flex items-center justify-center gap-1">
                <Cpu size={10} className="text-blue-600" /> Target CPU
              </span>
              <span className={`text-lg font-bold font-mono ${statusData.cpu_usage_percent > 85 ? 'text-rose-600' : 'text-gray-600'}`}>
                {statusData.cpu_usage_percent}%
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            {onNavigateToIntelligence && (
              <button
                onClick={onNavigateToIntelligence}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-blue-600 border border-gray-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="View AI Threat Intelligence Breakdown"
              >
                <BrainCircuit size={16} />
              </button>
            )}

            {onOpenDemoScenarios && (
              <button
                onClick={onOpenDemoScenarios}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-gray-900 text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Activity size={13} />
                <span>Simulate</span>
                <ArrowUpRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

