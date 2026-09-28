import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  User,
  Clock,
  Globe,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  FileText,
} from 'lucide-react';
import Topbar from '../components/Topbar';
import Button from '../components/ui/Button';
import { api, type AuditLogEntry } from '../services/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        page,
        limit: 25,
        search: search || undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
      });

      if (Array.isArray(res)) {
        setLogs(res);
        setTotalCount(res.length);
        setTotalPages(1);
      } else if (res && res.data) {
        setLogs(res.data);
        setPage(res.page || 1);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || res.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes('FAILED') || action.includes('DISABLED') || action.includes('REVOKE')) {
      return 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]';
    }
    if (action.includes('ROLE') || action.includes('UPDATE') || action.includes('RESOLVE')) {
      return 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]';
    }
    if (action.includes('LOGIN') || action.includes('REGISTER') || action.includes('CREATE')) {
      return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]';
    }
    return 'bg-[#F0FDFA] text-[#0D9488] border-[#CCFBF1]';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Topbar
        title="Audit Logs & Security Trail"
        subtitle="Immutable MongoDB-backed SOC event audit trail, administrative action history, and access logs"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search query */}
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action, IP, resource..."
              className="w-full pl-8 pr-3.5 py-1.5 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer"
          >
            <option value="all">All Action Types</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="USER_LOGOUT">USER_LOGOUT</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
            <option value="USER_DISABLED">USER_DISABLED</option>
            <option value="THREAT_UPDATED">THREAT_UPDATED</option>
            <option value="ALERT_UPDATED">ALERT_UPDATED</option>
            <option value="SESSION_TERMINATED">SESSION_TERMINATED</option>
            <option value="REPORT_GENERATED">REPORT_GENERATED</option>
          </select>

          <Button
            type="submit"
            variant="primary"
            size="sm"
          >
            Filter Logs
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<RefreshCw size={13} className={loading ? 'animate-spin text-[#2563EB]' : ''} />}
            onClick={fetchLogs}
            aria-label="Refresh logs"
          >
            Refresh
          </Button>
        </form>

        <div className="text-xs text-[#667085] font-mono">
          Showing <span className="text-[#172033] font-semibold">{logs.length}</span> of {totalCount} records
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-[#E4E7EC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E4E7EC] bg-[#F8FAFC] text-[11px] font-semibold text-[#667085]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator / User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource Target</th>
                <th className="py-3 px-4">Source IP & Device</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F4F9] text-[#172033]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#667085]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#2563EB]" />
                    Querying audit trail from MongoDB...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#667085]">
                    No audit records found matching query parameters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.logId || log._id || log.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#667085] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-[#98A2B3] shrink-0" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold text-[#172033] flex items-center gap-1.5">
                          <User size={13} className="text-[#98A2B3]" />
                          <span>{log.userName || log.userEmail || log.userId}</span>
                        </div>
                        {log.userRole && (
                          <span className="text-[10px] font-mono uppercase text-[#2563EB] font-medium">
                            Role: {log.userRole}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className="text-[#344054] font-medium">{log.resourceType}</span>
                      {log.resourceId && (
                        <span className="text-[#98A2B3] ml-1.5">({log.resourceId})</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-[#667085]">
                      <div className="flex items-center gap-1.5">
                        <Globe size={12} className="text-[#98A2B3] shrink-0" />
                        <span>{log.ipAddress || '127.0.0.1'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<FileText size={12} />}
                        onClick={() => setSelectedLog(log)}
                      >
                        View JSON
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-[#E4E7EC] flex items-center justify-between text-xs text-[#667085]">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous Page"
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next Page"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-[#E4E7EC] bg-white p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4E7EC]">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-[#2563EB]" />
                <h3 className="font-bold text-[#172033] text-sm">Audit Record Detail: {selectedLog.logId}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#667085] hover:text-[#172033]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] text-[11px] font-mono text-[#1E293B] max-h-96 overflow-y-auto">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>

            <div className="flex justify-end mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
