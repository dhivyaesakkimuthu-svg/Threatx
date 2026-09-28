import { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Plus,
  Download,
  Clock,
  User,
  RefreshCw,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Search,
} from 'lucide-react';
import Topbar from '../components/Topbar';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Button from '../components/ui/Button';
import { api, type SecurityReport } from '../services/api';

export default function Reports() {
  const [reports, setReports] = useState<SecurityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('security_summary');
  const [newSummary, setNewSummary] = useState('');
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedReport, setSelectedReport] = useState<SecurityReport | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const data = await api.getReports();
      setReports(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch compliance and security reports');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    setGenerating(true);
    try {
      const created = await api.createReport({
        title: newTitle,
        type: newType,
        summary: newSummary || 'Automated ThreatX SOC security telemetry analysis report',
        author: 'ThreatX SOC Lead',
        severity: 'medium',
        period: 'Last 24 Hours',
      });
      setReports((prev) => [created, ...prev]);
      setShowGenerateModal(false);
      setNewTitle('');
      setNewSummary('');
    } catch (err: any) {
      alert(`Could not generate report: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const exportJSON = (rep: SecurityReport) => {
    const blob = new Blob([JSON.stringify(rep, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threatx-${rep.reportId || 'report'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = (rep: SecurityReport) => {
    const headers = ['Report ID', 'Title', 'Type', 'Status', 'Generated At', 'Created By', 'Summary'];
    const row = [
      rep.reportId,
      `"${rep.title.replace(/"/g, '""')}"`,
      rep.type,
      rep.status,
      rep.generatedAt,
      rep.createdBy || rep.author,
      `"${(rep.summary || '').replace(/"/g, '""')}"`,
    ];
    const csvContent = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threatx-${rep.reportId || 'report'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredReports = reports.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.type?.toLowerCase().includes(q) ||
      r.reportId?.toLowerCase().includes(q) ||
      r.summary?.toLowerCase().includes(q)
    );
  });

  if (loading && reports.length === 0) {
    return (
      <div className="space-y-6">
        <Topbar title="Security Reports & Audit" subtitle="Fetching compliance records..." />
        <LoadingState />
      </div>
    );
  }

  if (error && reports.length === 0) {
    return (
      <div className="space-y-6">
        <Topbar title="Security Reports & Audit" connectionStatus="offline" />
        <ErrorState message={error} onRetry={fetchReports} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Topbar
        title="Security Reports & Audit"
        subtitle="Generate, export and audit compliance and executive brief documents from MongoDB"
      />

      {/* Control Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" size={14} />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E4E7EC] rounded-lg text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] w-48 sm:w-64"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#2563EB]' : ''} />}
            onClick={() => {
              setIsRefreshing(true);
              fetchReports();
            }}
          >
            Sync Reports
          </Button>
          <span className="text-xs text-[#667085] font-mono hidden md:inline-block">
            {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'}
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setShowGenerateModal(true)}
        >
          Generate New Security Report
        </Button>
      </div>

      {/* Reports List Table */}
      {filteredReports.length === 0 ? (
        <EmptyState
          title="No reports found"
          description={searchQuery ? "No security reports matched your query." : "Click 'Generate New Security Report' to compile your first SOC summary."}
          actionLabel={searchQuery ? "Clear Search" : "Generate Report"}
          onAction={() => {
            if (searchQuery) setSearchQuery('');
            else setShowGenerateModal(true);
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#E4E7EC] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E7EC] bg-[#F8FAFC] text-[#667085] font-semibold text-[11px]">
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Report Title & Summary</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Generated At</th>
                  <th className="py-3 px-4">Created By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9]">
                {filteredReports.map((rep) => {
                  const id = rep.id || rep.reportId;
                  const genDate = rep.generatedAt || rep.createdAt;
                  const formattedDate = genDate ? new Date(genDate).toLocaleDateString() : 'Recent';

                  return (
                    <tr
                      key={id}
                      onClick={() => setSelectedReport(rep)}
                      className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-[#2563EB] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-[#2563EB] shrink-0" />
                          {rep.reportId || id}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs md:max-w-md">
                        <span className="font-semibold text-[#172033] block text-xs truncate">
                          {rep.title}
                        </span>
                        <span className="text-[11px] text-[#667085] block truncate mt-0.5">
                          {rep.summary || 'Security operations summary report'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]">
                          {rep.type?.replace(/_/g, ' ') || 'Summary'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                          <CheckCircle2 size={11} /> {rep.status || 'Generated'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#667085] text-[11px] whitespace-nowrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={11} className="text-[#98A2B3]" /> {formattedDate}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#475467] text-[11px] whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <User size={11} className="text-[#98A2B3]" /> {rep.createdBy || rep.author || 'SOC Lead'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedReport(rep)}
                            className="p-1.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F1F4F9] transition-colors"
                            title="Inspect Report"
                            aria-label="Inspect Report"
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            onClick={() => exportJSON(rep)}
                            className="p-1.5 rounded-lg text-[#667085] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                            title="Export JSON"
                            aria-label="Export JSON"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => exportCSV(rep)}
                            className="p-1.5 rounded-lg text-[#667085] hover:text-[#059669] hover:bg-[#ECFDF5] transition-colors"
                            title="Export CSV"
                            aria-label="Export CSV"
                          >
                            <FileSpreadsheet size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Inspection Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="rounded-xl bg-white border border-[#E4E7EC] p-6 max-w-2xl w-full shadow-xl space-y-5">
            <div className="flex items-start justify-between pb-4 border-b border-[#E4E7EC]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#172033]">{selectedReport.title}</h3>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]">
                      {selectedReport.type?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-[#667085] font-mono mt-0.5">{selectedReport.reportId || selectedReport.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-[#667085] hover:text-[#172033] rounded-lg hover:bg-[#F1F4F9]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E4E7EC] text-xs">
              <div>
                <span className="text-[10px] text-[#667085] uppercase font-semibold tracking-wider block">Status</span>
                <span className="font-semibold text-[#059669] font-mono uppercase">{selectedReport.status || 'Generated'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#667085] uppercase font-semibold tracking-wider block">Author</span>
                <span className="font-medium text-[#172033]">{selectedReport.createdBy || selectedReport.author || 'ThreatX SOC'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#667085] uppercase font-semibold tracking-wider block">Date</span>
                <span className="font-mono text-[#475467]">
                  {selectedReport.generatedAt ? new Date(selectedReport.generatedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#667085] uppercase font-semibold tracking-wider block">Period</span>
                <span className="font-medium text-[#2563EB]">{selectedReport.period || '24h Standard'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#172033] uppercase tracking-wider block">Executive Summary & Findings</label>
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] text-xs text-[#475467] leading-relaxed max-h-48 overflow-y-auto">
                {selectedReport.summary || 'No detailed summary provided.'}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E4E7EC] flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download size={13} />}
                  onClick={() => exportJSON(selectedReport)}
                >
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<FileSpreadsheet size={13} />}
                  onClick={() => exportCSV(selectedReport)}
                >
                  Export CSV
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReport(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="rounded-xl bg-white border border-[#E4E7EC] p-6 max-w-lg w-full shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E7EC] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                  <FileText size={18} />
                </div>
                <h3 className="text-base font-bold text-[#172033]">Generate Security Report</h3>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1.5 text-[#667085] hover:text-[#172033] rounded-lg hover:bg-[#F1F4F9]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-1.5">
                  Report Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q3 SOC Perimeter Security Audit"
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-1.5">
                  Report Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                >
                  <option value="security_summary">Security Summary</option>
                  <option value="compliance_audit">Compliance Audit</option>
                  <option value="threat_incident">Threat Incident Analysis</option>
                  <option value="executive_brief">Executive Brief</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-1.5">
                  Executive Summary / Brief
                </label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Summarize key risk vectors, mitigation results, and incident counts..."
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-3 border-t border-[#E4E7EC] flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGenerateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Create Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
