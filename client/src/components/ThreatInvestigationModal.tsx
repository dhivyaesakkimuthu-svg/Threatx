import { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  X,
  Terminal,
  Clock,
  Activity,
  Server as ServerIcon,
  User,
  Globe,
  Radio,
  BrainCircuit,
  ShieldX,
} from 'lucide-react';
import { api } from '../services/api';
import SeverityBadge from './ui/SeverityBadge';
import StatusBadge from './StatusBadge';
import type { ThreatEvent, RiskLevel } from '../types';

interface ThreatInvestigationModalProps {
  threat: ThreatEvent | null;
  onClose: () => void;
  onThreatUpdated?: (updated: ThreatEvent) => void;
}

export default function ThreatInvestigationModal({
  threat,
  onClose,
  onThreatUpdated,
}: ThreatInvestigationModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!threat) return null;

  const threatId = threat.id || (threat as any).threatId || 'THR-???';
  const riskLvl = (threat.riskLevel || (threat.severity ? (threat.severity.charAt(0).toUpperCase() + threat.severity.slice(1)) : 'High')) as RiskLevel;
  const typeStr = threat.threatType || threat.type || 'Security Event';
  const userStr = threat.username || 'system';
  const ipStr = threat.ipAddress || threat.source || '127.0.0.1';
  const srvStr = threat.serverName || threat.target || 'SRV-001';
  const timeStr = threat.timestamp || (threat as any).detectedAt || (threat as any).createdAt || new Date().toISOString();
  const currentStatus = String(threat.status || (threat.acknowledged ? 'mitigated' : 'active')).toLowerCase();

  const handleStatusChange = async (newStatus: 'investigating' | 'mitigated' | 'blocked' | 'open') => {
    setIsUpdating(true);
    try {
      const updated = await api.updateThreat(threatId, {
        status: newStatus,
        acknowledged: newStatus === 'mitigated' || newStatus === 'blocked',
      });
      if (onThreatUpdated) onThreatUpdated(updated);
    } catch (e: any) {
      console.error('Failed to update threat:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Build the chronological investigation timeline
  const detectedDate = new Date(timeStr);
  const isPendingTriage = currentStatus === 'new' || currentStatus === 'open';
  const isResolved = currentStatus === 'mitigated' || currentStatus === 'blocked';

  const timelineSteps = [
    {
      title: 'Threat Detected',
      description: `Anomaly captured on ${srvStr} interface`,
      timestamp: detectedDate.toLocaleTimeString(),
      status: 'completed',
      color: 'text-red-600',
    },
    {
      title: 'Alert Correlated',
      description: `Correlated ${typeStr} signature in ThreatX SIEM`,
      timestamp: new Date(detectedDate.getTime() + 15000).toLocaleTimeString(),
      status: 'completed',
      color: 'text-amber-600',
    },
    {
      title: 'Analyst Triage',
      description: !isPendingTriage
        ? 'Analyst active in Threat Investigation console'
        : 'Awaiting SOC analyst triage',
      timestamp: !isPendingTriage
        ? new Date(detectedDate.getTime() + 45000).toLocaleTimeString()
        : 'Pending',
      status: !isPendingTriage ? 'completed' : 'pending',
      color: !isPendingTriage ? 'text-blue-600' : 'text-gray-500',
    },
    {
      title: 'Mitigation & Quarantine',
      description: isResolved
        ? `Host threat state resolved (${currentStatus.toUpperCase()})`
        : 'Automatic or manual containment policy',
      timestamp: isResolved
        ? new Date(detectedDate.getTime() + 90000).toLocaleTimeString()
        : 'Awaiting Action',
      status: isResolved ? 'completed' : 'pending',
      color: isResolved ? 'text-emerald-600' : 'text-gray-500',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-white border border-[#E4E7EC] p-6 shadow-lg space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs font-bold text-slate-700">{threatId}</span>
                <SeverityBadge severity={threat.severity || riskLvl} size="sm" />
                <StatusBadge status={currentStatus} size="sm" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{typeStr}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close investigation modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Threat Summary Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal size={14} className="text-blue-600" /> Incident Description & Root Cause
          </h4>
          <p className="text-slate-800 text-xs leading-relaxed">
            {threat.description || threat.explanation || 'Suspicious cyber threat vector detected by ThreatX.'}
          </p>
        </div>

        {/* 4-Box Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-gray-400 block uppercase font-medium mb-0.5 flex items-center gap-1">
              <Globe size={11} className="text-blue-600" /> Source IP
            </span>
            <span className="text-slate-900 font-bold font-mono text-xs">{ipStr}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-gray-400 block uppercase font-medium mb-0.5 flex items-center gap-1">
              <ServerIcon size={11} className="text-blue-600" /> Target Node
            </span>
            <span className="text-slate-900 font-bold font-mono text-xs">{srvStr}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-gray-400 block uppercase font-medium mb-0.5 flex items-center gap-1">
              <User size={11} className="text-blue-600" /> Username
            </span>
            <span className="text-slate-900 font-bold text-xs">{userStr}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-gray-400 block uppercase font-medium mb-0.5 flex items-center gap-1">
              <Radio size={11} className="text-red-600" /> Risk Score
            </span>
            <span className="text-red-600 font-bold font-mono text-xs">{threat.riskScore ?? 85}/100</span>
          </div>
        </div>

        {/* AI Threat Intelligence & Heuristics Assessment */}
        <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-blue-100 text-blue-700">
                <BrainCircuit size={16} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                AI Threat Intelligence Analysis
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-bold">
                  Confidence: {threat.aiAnalysis?.confidence ?? 92}%
                </span>
              </h4>
            </div>

            {threat.aiAnalysis?.anomalies && threat.aiAnalysis.anomalies.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {threat.aiAnalysis.anomalies.map((anom) => (
                  <span
                    key={anom}
                    className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200"
                  >
                    {anom}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Explainable reasons */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600">
              Explainable Detection Reasons:
            </span>
            <ul className="space-y-1 text-xs text-slate-700">
              {(threat.aiAnalysis?.reasons || [
                `Event signature matches high-risk vector '${typeStr}'`,
                `Host telemetry correlated with suspicious activity from ${ipStr}`,
                threat.description,
              ]).map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">›</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Response */}
          <div className="p-2.5 rounded-lg bg-white border border-blue-100 text-xs">
            <span className="font-semibold text-blue-800">Recommended Response: </span>
            <span className="text-slate-700">
              {threat.aiAnalysis?.recommendedAction ||
                (threat.severity === 'critical'
                  ? 'Isolate host, revoke active authentication tokens, and block source IP.'
                  : 'Review recent access logs and inspect active sessions.')}
            </span>
          </div>
        </div>

        {/* Related Activity Timeline */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
            <Activity size={14} className="text-blue-600" /> Incident Lifecycle Trace
          </h4>

          <div className="relative pl-5 space-y-3.5 border-l border-slate-200 ml-2.5">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="relative">
                <span
                  className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                    step.status === 'completed'
                      ? 'bg-blue-600'
                      : 'bg-slate-300'
                  }`}
                />
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${step.color}`}>{step.title}</span>
                  <span className="text-[11px] font-mono text-gray-500">{step.timestamp}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action controls footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
            <Clock size={12} />
            <span>Logged: {new Date(timeStr).toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {currentStatus !== 'investigating' && (
              <button
                disabled={isUpdating}
                onClick={() => handleStatusChange('investigating')}
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-xs transition-all cursor-pointer"
              >
                Mark Investigating
              </button>
            )}

            {currentStatus !== 'blocked' && (
              <button
                disabled={isUpdating}
                onClick={() => handleStatusChange('blocked')}
                className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ShieldX size={13} />
                <span>Block Source IP</span>
              </button>
            )}

            {currentStatus !== 'mitigated' && (
              <button
                disabled={isUpdating}
                onClick={() => handleStatusChange('mitigated')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-gray-900 font-semibold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} />
                <span>Mitigate & Resolve</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
