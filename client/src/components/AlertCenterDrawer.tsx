import React, { useState } from 'react';
import {
  Bell,
  X,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Search,
  CheckSquare,
} from 'lucide-react';
import { api } from '../services/api';
import SeverityBadge from './ui/SeverityBadge';
import StatusBadge from './StatusBadge';
import type { Alert } from '../types';

interface AlertCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  onAlertUpdated: (updated: Alert) => void;
  onMarkAllRead: () => void;
}

export default function AlertCenterDrawer({
  isOpen,
  onClose,
  alerts,
  onAlertUpdated,
  onMarkAllRead,
}: AlertCenterDrawerProps) {
  const [activeTab, setActiveTab] = useState<'open' | 'critical' | 'high' | 'resolved'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [selectedAlertForDetails, setSelectedAlertForDetails] = useState<Alert | null>(null);

  if (!isOpen) return null;

  const handleTriageAction = async (
    alert: Alert,
    newStatus: 'investigating' | 'resolved' | 'dismissed',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const id = alert.id || alert.alertId;
    setIsUpdatingId(id);
    try {
      const updated = await api.updateAlert(id, {
        status: newStatus,
        read: true,
      });
      onAlertUpdated(updated);
      if (selectedAlertForDetails?.id === id || selectedAlertForDetails?.alertId === id) {
        setSelectedAlertForDetails(updated);
      }
    } catch (err: any) {
      console.error('Failed to triage alert:', err);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const status = String(a.status || 'open').toLowerCase();
    const severity = (a.severity || a.riskLevel || 'high').toLowerCase();

    // Tab filtering
    let matchesTab = false;
    if (activeTab === 'open') {
      matchesTab = status === 'open' || status === 'investigating';
    } else if (activeTab === 'critical') {
      matchesTab = severity === 'critical' && status !== 'resolved' && status !== 'dismissed';
    } else if (activeTab === 'high') {
      matchesTab = (severity === 'high' || severity === 'critical') && status !== 'resolved' && status !== 'dismissed';
    } else if (activeTab === 'resolved') {
      matchesTab = status === 'resolved' || status === 'dismissed' || status === 'closed';
    }

    // Search query
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.alertId && a.alertId.toLowerCase().includes(q)) ||
      (a.source && a.source.toLowerCase().includes(q)) ||
      (a.description && a.description.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  const openCount = alerts.filter((a) => (a.status || 'open') === 'open').length;
  const criticalCount = alerts.filter((a) => {
    const st = String(a.status || '').toLowerCase();
    return (a.severity || a.riskLevel || '').toLowerCase() === 'critical' && st !== 'resolved' && st !== 'dismissed';
  }).length;
  const highCount = alerts.filter((a) => {
    const st = String(a.status || '').toLowerCase();
    const sev = (a.severity || a.riskLevel || '').toLowerCase();
    return (sev === 'high' || sev === 'critical') && st !== 'resolved' && st !== 'dismissed';
  }).length;
  const resolvedCount = alerts.filter((a) => {
    const st = String(a.status || '').toLowerCase();
    return st === 'resolved' || st === 'dismissed' || st === 'closed';
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-white/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-white border-l border-[#E4E7EC] h-full flex flex-col shadow-lg">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Bell size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Alert Center
                </h3>
                {openCount > 0 && (
                  <span className="px-2 py-0.2 rounded-full bg-red-600 text-gray-900 font-bold text-xs">
                    {openCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Security event triage and incident alarms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {openCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare size={13} />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close alerts panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search bar & Tabs */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, title, IP or source..."
              className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('open')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'open'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-gray-400 hover:text-slate-800'
              }`}
            >
              Open ({openCount})
            </button>
            <button
              onClick={() => setActiveTab('critical')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'critical'
                  ? 'bg-red-600 text-gray-900 shadow-xs'
                  : 'text-red-700 hover:text-red-800'
              }`}
            >
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setActiveTab('high')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'high'
                  ? 'bg-orange-600 text-gray-900 shadow-xs'
                  : 'text-orange-700 hover:text-orange-800'
              }`}
            >
              High ({highCount})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'resolved'
                  ? 'bg-emerald-600 text-gray-900 shadow-xs'
                  : 'text-gray-400 hover:text-slate-800'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-16 text-xs text-gray-400">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-600" />
              <p className="font-semibold text-slate-800">No alerts in this category</p>
              <p className="text-xs text-gray-500 mt-0.5">All incidents have been triaged</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const id = alert.id || alert.alertId;
              const isUpdating = isUpdatingId === id;
              const isCrit = (alert.severity || alert.riskLevel || '').toLowerCase() === 'critical';

              return (
                <div
                  key={id}
                  onClick={() => setSelectedAlertForDetails(alert)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-white shadow-xs hover:border-slate-300 ${
                    isCrit && alert.status === 'open'
                      ? 'border-l-4 border-l-red-600'
                      : alert.status === 'open'
                      ? 'border-l-4 border-l-amber-500'
                      : 'border-l-4 border-l-emerald-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isCrit
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}
                      >
                        <ShieldAlert size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs font-bold text-slate-900">{alert.alertId || id}</span>
                          <SeverityBadge severity={alert.severity || alert.riskLevel || 'high'} size="sm" />
                          <StatusBadge status={alert.status || 'open'} size="sm" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{alert.title}</h4>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{alert.description}</p>
                        
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500 font-medium">
                          <span>Source: {alert.source || 'ThreatX Core'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock size={10} />
                            {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Recent'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {alert.status !== 'resolved' && alert.status !== 'dismissed' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {alert.status === 'open' && (
                        <button
                          disabled={isUpdating}
                          onClick={(e) => handleTriageAction(alert, 'investigating', e)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Investigate
                        </button>
                      )}
                      <button
                        disabled={isUpdating}
                        onClick={(e) => handleTriageAction(alert, 'resolved', e)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Resolve
                      </button>
                      <button
                        disabled={isUpdating}
                        onClick={(e) => handleTriageAction(alert, 'dismissed', e)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected Alert Inspection Modal */}
        {selectedAlertForDetails && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-white/40 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E4E7EC] p-5 shadow-lg space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-700">{selectedAlertForDetails.alertId}</span>
                    <SeverityBadge severity={selectedAlertForDetails.severity || 'high'} size="sm" />
                    <StatusBadge status={selectedAlertForDetails.status || 'open'} size="sm" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{selectedAlertForDetails.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedAlertForDetails(null)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                {selectedAlertForDetails.description}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase block font-medium">Source Node</span>
                  <span className="font-semibold text-slate-900 font-mono">{selectedAlertForDetails.source || 'SRV-001'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-gray-500 uppercase block font-medium">Timestamp</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {selectedAlertForDetails.timestamp ? new Date(selectedAlertForDetails.timestamp).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedAlertForDetails(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
