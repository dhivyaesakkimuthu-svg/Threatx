import { useEffect, useState, useCallback } from 'react';
import {
  CheckSquare,
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import Topbar from '../components/Topbar';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { api } from '../services/api';
import { subscribeToAlerts, subscribeToAlertUpdates } from '../services/socket';
import type { Alert } from '../types';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<Alert | null>(null);
  const pageSize = 12;

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load system security alerts');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const unsubNew = subscribeToAlerts((newAlert) => {
      setAlerts((prev) => [
        newAlert,
        ...prev.filter((a) => (a.alertId || a.id) !== (newAlert.alertId || newAlert.id)),
      ]);
    });

    const unsubUpdate = subscribeToAlertUpdates((updated) => {
      setAlerts((prev) =>
        prev.map((a) => ((a.alertId || a.id) === (updated.alertId || updated.id) ? updated : a))
      );
    });

    const interval = setInterval(fetchAlerts, 10000);

    return () => {
      clearInterval(interval);
      unsubNew();
      unsubUpdate();
    };
  }, [fetchAlerts]);

  const handleStatusChange = async (id: string, newStatus: 'open' | 'investigating' | 'resolved' | 'dismissed') => {
    try {
      const updated = await api.updateAlert(id, {
        status: newStatus,
        read: newStatus !== 'open',
      });
      setAlerts((prev) =>
        prev.map((a) => (a.id === id || a.alertId === id ? updated : a))
      );
      if (selectedAlertForModal?.id === id || selectedAlertForModal?.alertId === id) {
        setSelectedAlertForModal(updated);
      }
    } catch (err: any) {
      alert(`Could not update alert: ${err.message}`);
    }
  };

  const handleMarkAllRead = async () => {
    await api.markAllAlertsRead().catch(console.error);
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true, status: a.status === 'open' ? 'investigating' : a.status })));
  };

  const filteredAlerts = alerts.filter((alert) => {
    const sev = (alert.severity || alert.riskLevel || '').toLowerCase();
    const matchesSev = filterSeverity === 'all' || sev === filterSeverity.toLowerCase();
    const st = (alert.status || 'open').toLowerCase();
    const matchesStatus = filterStatus === 'all' || st === filterStatus.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      (alert.title && alert.title.toLowerCase().includes(query)) ||
      (alert.alertId && alert.alertId.toLowerCase().includes(query)) ||
      (alert.source && alert.source.toLowerCase().includes(query)) ||
      (alert.description && alert.description.toLowerCase().includes(query));
    return matchesSev && matchesStatus && matchesQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedAlerts = filteredAlerts.slice((validPage - 1) * pageSize, validPage * pageSize);

  const getSeverityPill = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const unreadCount = alerts.filter((a) => !a.read && a.status === 'open').length;

  if (loading && alerts.length === 0) {
    return (
      <div className="space-y-6">
        <Topbar title="Alert Center" subtitle="Fetching incident notifications..." />
        <LoadingState />
      </div>
    );
  }

  if (error && alerts.length === 0) {
    return (
      <div className="space-y-6">
        <Topbar title="Alert Center" connectionStatus="offline" />
        <ErrorState message={error} onRetry={fetchAlerts} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Topbar
        title="Alert Center & Triage"
        subtitle={`${unreadCount} pending high-priority alert${unreadCount !== 1 ? 's' : ''} stored in MongoDB`}
      />

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search alert ID, title, IP..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] text-xs text-[#172033] placeholder:text-[#667085] focus:outline-none focus:border-blue-500 w-56"
            />
          </div>

          {/* Severity filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-[#E4E7EC] text-[11px] font-semibold">
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => {
                  setFilterSeverity(sev);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-0.5 rounded capitalize transition-all font-semibold ${
                  filterSeverity === sev
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-[#667085] hover:text-[#172033] hover:bg-slate-200/60'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-[#E4E7EC] text-[11px] font-semibold">
            {(['all', 'open', 'investigating', 'resolved', 'dismissed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setFilterStatus(st);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-0.5 rounded capitalize transition-all font-semibold ${
                  filterStatus === st
                    ? 'bg-white text-teal-700 shadow-xs font-bold'
                    : 'text-[#667085] hover:text-[#172033] hover:bg-slate-200/60'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all shadow-xs"
            >
              <CheckSquare size={13} /> Acknowledge All ({unreadCount})
            </button>
          )}
          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchAlerts();
            }}
            className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] text-[#667085] hover:text-[#172033] transition-colors"
            title="Refresh Alerts"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          title="No alerts found"
          description="All clear. No active alerts match your search or filter criteria in MongoDB."
          onAction={fetchAlerts}
          actionLabel="Refresh Alerts"
        />
      ) : (
        <div className="space-y-3">
          {paginatedAlerts.map((alert) => {
            const id = alert.id || alert.alertId;
            const sev = alert.severity || alert.riskLevel || 'high';
            const status = alert.status || 'open';
            const createdAt = alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'Just now';
            const isCrit = (alert.severity || alert.riskLevel || '').toLowerCase() === 'critical';

            return (
              <div
                key={id}
                onClick={() => setSelectedAlertForModal(alert)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-2xs hover:shadow-xs ${
                  isCrit && status === 'open'
                    ? 'border-l-4 border-l-red-600 border-[#E4E7EC] hover:border-red-300'
                    : 'border-[#E4E7EC] hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-lg border shrink-0 mt-0.5 ${
                      isCrit
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-blue-50 border-blue-100 text-blue-600'
                    }`}
                  >
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">{alert.alertId || id}</span>
                      <h4 className="text-sm font-bold text-[#172033]">{alert.title}</h4>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getSeverityPill(sev)}`}>
                        {sev}
                      </span>
                    </div>

                    <p className="text-xs text-[#667085] mt-1">{alert.description || alert.message || 'Threat detection alert triggered on perimeter.'}</p>

                    <div className="flex items-center gap-4 mt-2 text-[10px] text-[#667085] font-mono">
                      <span>Source: <strong className="text-[#172033]">{alert.source || '192.168.1.20'}</strong></span>
                      {alert.target && <span>Target: <strong className="text-[#172033]">{alert.target}</strong></span>}
                      <span className="flex items-center gap-1"><Clock size={10} /> {createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Status Triage Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] uppercase font-bold text-[#667085] mr-1">Triage:</span>
                  {(['open', 'investigating', 'resolved', 'dismissed'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(id, st)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold capitalize transition-all border ${
                        status === st
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-[#F8FAFC] text-[#667085] border-[#E4E7EC] hover:text-[#172033] hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {filteredAlerts.length > pageSize && (
            <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] flex items-center justify-between text-xs text-[#667085] shadow-xs">
              <span className="font-mono text-[11px]">
                Showing {(validPage - 1) * pageSize + 1} to {Math.min(validPage * pageSize, filteredAlerts.length)} of {filteredAlerts.length} alerts
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={validPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] disabled:opacity-40 hover:text-[#172033] transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="font-mono px-2 text-[#172033] font-bold">
                  Page {validPage} / {totalPages}
                </span>
                <button
                  disabled={validPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] disabled:opacity-40 hover:text-[#172033] transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alert Inspection Modal */}
      {selectedAlertForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E4E7EC] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#E4E7EC]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{selectedAlertForModal.alertId}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getSeverityPill(selectedAlertForModal.severity || selectedAlertForModal.riskLevel || 'high')}`}>
                    {selectedAlertForModal.severity || selectedAlertForModal.riskLevel || 'high'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#172033]">{selectedAlertForModal.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAlertForModal(null)}
                className="p-1.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC]">
                <span className="text-[10px] text-[#667085] font-bold uppercase block mb-1">Description</span>
                <p className="text-[#172033] leading-relaxed">
                  {selectedAlertForModal.description || selectedAlertForModal.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-xl font-mono text-xs border border-[#E4E7EC]">
                <div>
                  <span className="text-[#667085] block text-[10px] uppercase font-sans font-medium">Source Address</span>
                  <span className="text-[#172033] font-bold">{selectedAlertForModal.source}</span>
                </div>
                <div>
                  <span className="text-[#667085] block text-[10px] uppercase font-sans font-medium">Target Entity</span>
                  <span className="text-[#172033] font-bold">{selectedAlertForModal.target || 'SRV-001'}</span>
                </div>
                <div>
                  <span className="text-[#667085] block text-[10px] uppercase font-sans font-medium">Created At</span>
                  <span className="text-[#172033]">{new Date(selectedAlertForModal.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#667085] block text-[10px] uppercase font-sans font-medium">SOC Lifecycle</span>
                  <span className="text-emerald-700 font-bold uppercase">{selectedAlertForModal.status || 'open'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E4E7EC] flex items-center justify-between">
              <button
                onClick={() => setSelectedAlertForModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-[#172033] text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(selectedAlertForModal.id || selectedAlertForModal.alertId, 'investigating')}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-2xs"
                >
                  Set Investigating
                </button>
                <button
                  onClick={() => handleStatusChange(selectedAlertForModal.id || selectedAlertForModal.alertId, 'resolved')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-2xs"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

