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
  let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let borderLeft = 'border-l-4 border-l-emerald-600';
  let postureDescription = 'Perimeter nominal. Baseline operations verified across all monitored nodes.';

  if (criticalThreats.length > 0 || riskScore >= 85) {
    postureState = 'CRITICAL';
    badgeStyle = 'bg-red-50 text-red-700 border-red-200';
    borderLeft = 'border-l-4 border-l-red-600';
    postureDescription = `Active critical intrusion detected (${criticalThreats[0]?.type || 'High-Risk Vector'}). Immediate containment required.`;
  } else if (highThreats.length > 0 || riskScore >= 70) {
    postureState = 'HIGH RISK';
    badgeStyle = 'bg-orange-50 text-orange-700 border-orange-200';
    borderLeft = 'border-l-4 border-l-orange-500';
    postureDescription = `Elevated authentication and access anomalies detected (${highThreats[0]?.type || 'Access Violation'}). Triage in progress.`;
  } else if (mediumThreats.length > 0 || openAlerts.length > 0 || riskScore >= 40) {
    postureState = 'ELEVATED';
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    borderLeft = 'border-l-4 border-l-amber-500';
    postureDescription = 'Non-critical telemetry spikes and port reconnaissance under active monitoring.';
  }

  const onlineServers = servers.filter((s) => s.status === 'online').length;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white border border-[#E4E7EC] ${borderLeft} p-5 shadow-xs transition-all duration-150`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        {/* Left Posture Indicator */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
              Enterprise SOC Posture:
            </span>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold tracking-wide border uppercase ${badgeStyle}`}>
              {postureState}
            </span>
          </div>

          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {postureState === 'NORMAL' && <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />}
            {postureState === 'ELEVATED' && <Activity className="w-5 h-5 text-amber-600 shrink-0" />}
            {postureState === 'HIGH RISK' && <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />}
            {postureState === 'CRITICAL' && <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />}
            <span>{postureDescription}</span>
          </h2>

          <p className="text-xs text-slate-500 leading-relaxed">
            Multi-factor telemetry analysis evaluating IP velocity, authentication frequencies, server load, and MITRE vector classifications in real time.
          </p>
        </div>

        {/* Center/Right Metrics & Controls */}
        <div className="flex flex-wrap items-center gap-3.5 sm:gap-5 bg-slate-50 border border-slate-200 p-3 rounded-xl">
          {/* Risk Score Gauge */}
          <div className="text-center min-w-[65px]">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Risk Score
            </span>
            <span className={`text-xl font-bold font-mono ${
              riskScore >= 80 ? 'text-red-600' : riskScore >= 50 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {riskScore}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </span>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          {/* Critical Threats */}
          <div className="text-center min-w-[55px]">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Critical
            </span>
            <span className={`text-lg font-bold font-mono ${criticalThreats.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {criticalThreats.length}
            </span>
          </div>

          {/* Open Alerts */}
          <div className="text-center min-w-[55px]">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Open Alerts
            </span>
            <span className={`text-lg font-bold font-mono ${openAlerts.length > 0 ? 'text-blue-600' : 'text-slate-800'}`}>
              {openAlerts.length}
            </span>
          </div>

          {/* Cluster Status */}
          <div className="text-center min-w-[60px] hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Servers
            </span>
            <span className="text-lg font-bold font-mono text-emerald-600">
              {onlineServers}/{servers.length || 3}
            </span>
          </div>

          {/* Live Node Telemetry */}
          {statusData && (
            <div className="text-center min-w-[65px] hidden md:block">
              <span className="text-[10px] uppercase font-bold text-slate-500 block flex items-center justify-center gap-1">
                <Cpu size={10} className="text-slate-500" /> Target CPU
              </span>
              <span className={`text-lg font-bold font-mono ${statusData.cpu_usage_percent > 85 ? 'text-red-600' : 'text-slate-800'}`}>
                {statusData.cpu_usage_percent}%
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            {onNavigateToIntelligence && (
              <button
                onClick={onNavigateToIntelligence}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                title="View AI Threat Intelligence Breakdown"
              >
                <BrainCircuit size={16} />
              </button>
            )}

            {onOpenDemoScenarios && (
              <button
                onClick={onOpenDemoScenarios}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
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
