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
import Button from '../components/ui/Button';
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
        return 'bg-rose-50 text-rose-500 border-rose-500/40';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-500 border-amber-500/40';
      default:
        return 'bg-blue-50 text-blue-500 border-blue-300';
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
    <div className="space-y-6 animate-fade-in pb-12">
      <Topbar
        title="Alert Center & Triage"
        subtitle={`${unreadCount} pending high-priority alert${unreadCount !== 1 ? 's' : ''} actively monitored`}
      />

      {/* Control Bar - Dark Theme */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-gray-200  shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search alert ID, title, IP..."
              className="pl-10 pr-4 py-2.5 rounded-xl bg-gray-50/70 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 w-56 font-sans"
            />
          </div>

          {/* Severity filter */}
          <div className="flex items-center gap-1 bg-gray-50/70 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => {
                  setFilterSeverity(sev);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all font-bold cursor-pointer ${
                  filterSeverity === sev
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-gray-50/70 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
            {(['all', 'open', 'investigating', 'resolved', 'dismissed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setFilterStatus(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all font-bold cursor-pointer ${
                  filterStatus === st
                    ? 'bg-emerald-600 text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-cyan-500/30 text-blue-500 border border-blue-300 text-xs font-bold transition-all shadow-lg shadow-cyan-500/10 cursor-pointer"
            >
              <CheckSquare size={14} /> Acknowledge All ({unreadCount})
            </button>
          )}
          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchAlerts();
            }}
            className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            title="Refresh Alerts"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          title="No alerts found"
          description="All clear. No active alerts match your search or filter criteria."
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
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white  shadow-xl hover:bg-slate-850 ${
                  isCrit && status === 'open'
                    ? 'border-l-4 border-l-rose-500 border-gray-200 hover:border-rose-300 shadow-sm'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                      isCrit
                        ? 'bg-rose-50 border-rose-500/40 text-rose-600'
                        : 'bg-blue-50 border-blue-300 text-blue-600'
                    }`}
                  >
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs text-blue-500 bg-cyan-500/15 px-2.5 py-0.5 rounded-md border border-blue-200 font-bold">{alert.alertId || id}</span>
                      <h4 className="text-sm font-bold text-gray-900 tracking-wide">{alert.title}</h4>
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getSeverityPill(sev)}`}>
                        {sev}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-1">{alert.description || alert.message || 'Threat detection alert triggered on perimeter.'}</p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-mono">
                      <span>Source: <strong className="text-blue-500">{alert.source || '192.168.1.20'}</strong></span>
                      {alert.target && <span>Target: <strong className="text-gray-900">{alert.target}</strong></span>}
                      <span className="flex items-center gap-1.5"><Clock size={12} className="text-blue-600" /> {createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Status Triage Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[11px] uppercase font-bold text-gray-500 mr-1">Triage:</span>
                  {(['open', 'investigating', 'resolved', 'dismissed'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                        status === st
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-gray-900 border-cyan-400 shadow-md'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-900 hover:bg-gray-100'
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
            <div className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <span className="font-mono text-xs">
                Showing {(validPage - 1) * pageSize + 1} to {Math.min(validPage * pageSize, filteredAlerts.length)} of {filteredAlerts.length} alerts
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={validPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="font-mono px-2 text-gray-900 font-bold">
                  Page {validPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={validPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alert Inspection Modal */}
      {selectedAlertForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0A0E1A] border border-gray-200 p-6 shadow-lg space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-500 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-300">{selectedAlertForModal.alertId}</span>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getSeverityPill(selectedAlertForModal.severity || selectedAlertForModal.riskLevel || 'high')}`}>
                    {selectedAlertForModal.severity || selectedAlertForModal.riskLevel || 'high'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900">{selectedAlertForModal.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAlertForModal(null)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Description</span>
                <p className="text-gray-700 leading-relaxed text-xs">
                  {selectedAlertForModal.description || selectedAlertForModal.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl font-mono text-xs border border-gray-200">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-sans font-bold">Source Address</span>
                  <span className="text-blue-500 font-bold">{selectedAlertForModal.source}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-sans font-bold">Target Entity</span>
                  <span className="text-gray-900 font-bold">{selectedAlertForModal.target || 'SRV-001'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-sans font-bold">Created At</span>
                  <span className="text-gray-600">{new Date(selectedAlertForModal.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-sans font-bold">SOC Lifecycle</span>
                  <span className="text-emerald-600 font-bold uppercase">{selectedAlertForModal.status || 'open'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setSelectedAlertForModal(null)}
              >
                Close
              </Button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(selectedAlertForModal.id || selectedAlertForModal.alertId, 'investigating')}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-gray-900 font-bold text-xs transition-colors shadow-md cursor-pointer"
                >
                  Set Investigating
                </button>
                <button
                  onClick={() => handleStatusChange(selectedAlertForModal.id || selectedAlertForModal.alertId, 'resolved')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-gray-900 font-bold text-xs transition-colors shadow-md cursor-pointer"
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
