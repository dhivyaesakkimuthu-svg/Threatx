import { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import ThreatInvestigationModal from './ThreatInvestigationModal';
import SeverityBadge from './ui/SeverityBadge';
import StatusBadge from './StatusBadge';
import type { ThreatEvent, RiskLevel } from '../types';

interface ThreatTableProps {
  threats: ThreatEvent[];
  onAcknowledge?: (id: string) => void;
  onBlockIp?: (ip: string) => void;
  onThreatUpdated?: (updated: ThreatEvent) => void;
  pageSize?: number;
}

export default function ThreatTable({
  threats,
  onAcknowledge: _onAcknowledge,
  onBlockIp,
  onThreatUpdated,
  pageSize = 10,
}: ThreatTableProps) {
  const [selectedThreat, setSelectedThreat] = useState<ThreatEvent | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const handleBlock = (ip: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBlockedIps(new Set([...blockedIps, ip]));
    if (onBlockIp) onBlockIp(ip);
  };

  const filteredThreats = threats.filter((t) => {
    const riskLevelStr = (t.riskLevel || t.severity || 'Medium').toLowerCase();
    const matchesSev = filterSeverity === 'all' || riskLevelStr === filterSeverity.toLowerCase();

    const statusStr = (t.status || (t.acknowledged ? 'mitigated' : 'active')).toLowerCase();
    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = statusStr === 'new' || statusStr === 'active' || statusStr === 'open';
    } else if (filterStatus !== 'all') {
      matchesStatus = statusStr === filterStatus.toLowerCase();
    }

    const query = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      (t.id || t.threatId || '').toLowerCase().includes(query) ||
      (t.username || '').toLowerCase().includes(query) ||
      (t.ipAddress || t.source || '').toLowerCase().includes(query) ||
      (t.threatType || t.type || '').toLowerCase().includes(query) ||
      (t.serverName || t.target || '').toLowerCase().includes(query) ||
      (t.description || '').toLowerCase().includes(query);

    return matchesSev && matchesStatus && matchesQuery;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredThreats.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedThreats = filteredThreats.slice((validPage - 1) * pageSize, validPage * pageSize);

  const formatRelativeTime = (iso?: string | Date) => {
    if (!iso) return 'Just now';
    try {
      const parsed = new Date(iso).getTime();
      if (isNaN(parsed)) return 'Just now';
      const diffMs = Date.now() - parsed;
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return new Date(iso).toLocaleDateString();
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="rounded-2xl bg-white  border border-gray-200 shadow-xl overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 border border-rose-200">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-wide">
              Threat Intelligence & Detection Stream
            </h3>
            <p className="text-xs text-gray-500">
              Correlated security anomalies & attack vector alerts
            </p>
          </div>
        </div>

        {/* Filters and search */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search threats..."
              className="pl-8.5 pr-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 transition-all w-40 sm:w-48"
            />
          </div>

          <div className="flex items-center bg-gray-50 border border-gray-200 p-0.5 rounded-xl text-xs font-semibold">
            {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                onClick={() => {
                  setFilterSeverity(sev);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg capitalize transition-all text-xs font-semibold cursor-pointer ${
                  filterSeverity === sev
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-gray-50 border border-gray-200 p-0.5 rounded-xl text-xs font-semibold">
            {['all', 'active', 'investigating', 'mitigated'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setFilterStatus(st);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg capitalize transition-all text-xs font-semibold cursor-pointer ${
                  filterStatus === st
                    ? 'bg-blue-600 text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider font-mono">
              <th className="py-3 px-4">Threat ID</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Threat Vector</th>
              <th className="py-3 px-4">Source & User</th>
              <th className="py-3 px-4">Target Node</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Detected</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedThreats.map((threat) => {
              const threatId = threat.id || (threat as any).threatId || 'THR-???';
              const riskLvl = (threat.riskLevel || (threat.severity ? (threat.severity.charAt(0).toUpperCase() + threat.severity.slice(1)) : 'High')) as RiskLevel;
              const typeStr = threat.threatType || threat.type || 'Security Event';
              const userStr = threat.username || 'system';
              const ipStr = threat.ipAddress || threat.source || '127.0.0.1';
              const srvStr = threat.serverName || threat.target || 'SRV-001';
              const timeStr = threat.timestamp || (threat as any).detectedAt || (threat as any).createdAt || new Date().toISOString();
              const isBlocked = blockedIps.has(ipStr) || threat.status === 'blocked';

              return (
                <tr
                  key={threatId}
                  onClick={() => setSelectedThreat(threat)}
                  className="hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                    {threatId}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <SeverityBadge severity={threat.severity || riskLvl} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-700">
                    <div className="truncate max-w-[200px]" title={typeStr}>
                      {typeStr}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div>
                      <span className="font-semibold text-gray-900">{userStr}</span>
                      <div className="text-[11px] text-blue-600/80 font-mono flex items-center gap-1.5">
                        <span className="bg-cyan-950/40 px-1 rounded border border-cyan-500/20">{ipStr}</span>
                        {threat.location && <span className="text-gray-500">• {threat.location}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap font-mono text-xs">
                    {srvStr}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge
                      status={
                        isBlocked
                          ? 'blocked'
                          : threat.status || (threat.acknowledged ? 'mitigated' : 'active')
                      }
                      size="sm"
                    />
                  </td>
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap text-xs font-mono">
                    {formatRelativeTime(timeStr)}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedThreat(threat)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 cursor-pointer"
                        title="Inspect Threat Details"
                        aria-label="Inspect threat"
                      >
                        <Eye size={14} />
                      </button>
                      {!isBlocked ? (
                        <button
                          onClick={(e) => handleBlock(ipStr, e)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-100 border border-rose-200 text-rose-500 text-[11px] font-semibold transition-all cursor-pointer"
                          title="Block Source IP at Perimeter"
                        >
                          Block IP
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 px-2 py-0.5 bg-rose-50 rounded border border-rose-200">
                          Blocked
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredThreats.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  <ShieldCheck size={32} className="mx-auto mb-2 text-emerald-600" />
                  No threats found matching current filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredThreats.length > pageSize && (
        <div className="p-3.5 sm:p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 bg-gray-50/40">
          <span>
            Showing {(validPage - 1) * pageSize + 1} to {Math.min(validPage * pageSize, filteredThreats.length)} of {filteredThreats.length} threats
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={validPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-100 text-gray-600 cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 text-gray-700 font-semibold font-mono">
              Page {validPage} / {totalPages}
            </span>
            <button
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-100 text-gray-600 cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}


      {/* Threat Investigation Drawer / Modal */}
      <ThreatInvestigationModal
        threat={selectedThreat}
        onClose={() => setSelectedThreat(null)}
        onThreatUpdated={(updated) => {
          if (onThreatUpdated) onThreatUpdated(updated);
          setSelectedThreat(updated);
        }}
      />
    </div>
  );
}
