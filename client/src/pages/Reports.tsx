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
    <div className="space-y-6 animate-fade-in pb-12">
      <Topbar
        title="Security Reports & Audit"
        subtitle="Generate, export and audit compliance and executive brief documents from MongoDB"
      />

      {/* Control Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-gray-200  shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 w-48 sm:w-64 font-sans"
            />
          </div>
          <Button
            variant="outline"
            size="md"
            icon={<RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />}
            onClick={() => {
              setIsRefreshing(true);
              fetchReports();
            }}
          >
            Sync Reports
          </Button>
          <span className="text-xs text-gray-500 font-mono hidden md:inline-block">
            {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'}
          </span>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus size={16} />}
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
        <div className="bg-white rounded-2xl border border-gray-200  shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-[#060911]/90 text-gray-500 font-bold text-xs uppercase tracking-wider">
                  <th className="py-4 px-5">Report ID</th>
                  <th className="py-4 px-5">Report Title &amp; Summary</th>
                  <th className="py-4 px-5">Type</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Generated At</th>
                  <th className="py-4 px-5">Created By</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-gray-700">
                {filteredReports.map((rep) => {
                  const id = rep.id || rep.reportId;
                  const genDate = rep.generatedAt || rep.createdAt;
                  const formattedDate = genDate ? new Date(genDate).toLocaleDateString() : 'Recent';

                  return (
                    <tr
                      key={id}
                      onClick={() => setSelectedReport(rep)}
                      className="hover:bg-gray-100/40 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-5 font-mono font-bold text-blue-600 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-blue-600 shrink-0" />
                          {rep.reportId || id}
                        </div>
                      </td>

                      <td className="py-4 px-5 max-w-xs md:max-w-md">
                        <span className="font-bold text-gray-900 block text-sm truncate">
                          {rep.title}
                        </span>
                        <span className="text-xs text-gray-500 block truncate mt-0.5">
                          {rep.summary || 'Security operations summary report'}
                        </span>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-500 border border-blue-200">
                          {rep.type?.replace(/_/g, ' ') || 'Summary'}
                        </span>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-500/30">
                          <CheckCircle2 size={13} /> {rep.status || 'Generated'}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-gray-600 text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1.5 font-mono">
                          <Clock size={13} className="text-blue-600" /> {formattedDate}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-gray-600 text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <User size={13} className="text-gray-500" /> {rep.createdBy || rep.author || 'SOC Lead'}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReport(rep)}
                            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors"
                            title="Inspect Report"
                            aria-label="Inspect Report"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            onClick={() => exportJSON(rep)}
                            className="p-2 rounded-xl text-blue-600 hover:text-gray-900 hover:bg-cyan-950/60 border border-blue-200 transition-colors"
                            title="Export JSON"
                            aria-label="Export JSON"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            onClick={() => exportCSV(rep)}
                            className="p-2 rounded-xl text-emerald-600 hover:text-gray-900 hover:bg-emerald-950/60 border border-emerald-500/30 transition-colors"
                            title="Export CSV"
                            aria-label="Export CSV"
                          >
                            <FileSpreadsheet size={15} />
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

      {/* Report Inspection Modal - Dark Cyber Styling */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="rounded-2xl bg-[#0A0E1A] border border-gray-200 p-6 max-w-2xl w-full shadow-lg space-y-5">
            <div className="flex items-start justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-gray-900 shadow-lg shadow-blue-500/20">
                  <FileText size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">{selectedReport.title}</h3>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-500 border border-blue-200">
                      {selectedReport.type?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedReport.reportId || selectedReport.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/70 p-4 rounded-xl border border-gray-200 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Status</span>
                <span className="font-bold text-emerald-600 font-mono uppercase">{selectedReport.status || 'Generated'}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Author</span>
                <span className="font-semibold text-gray-900">{selectedReport.createdBy || selectedReport.author || 'ThreatX SOC'}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Date</span>
                <span className="font-mono text-gray-600">
                  {selectedReport.generatedAt ? new Date(selectedReport.generatedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Period</span>
                <span className="font-bold text-blue-600">{selectedReport.period || '24h Standard'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Executive Summary &amp; Findings</label>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 leading-relaxed max-h-48 overflow-y-auto">
                {selectedReport.summary || 'No detailed summary provided.'}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download size={14} />}
                  onClick={() => exportJSON(selectedReport)}
                >
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<FileSpreadsheet size={14} />}
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

      {/* Generate Report Modal - Dark Cybersecurity */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="rounded-2xl bg-[#0A0E1A] border border-gray-200 p-6 max-w-lg w-full shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-gray-900 shadow-lg shadow-blue-500/20">
                  <FileText size={20} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Generate Security Report</h3>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Report Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q3 SOC Perimeter Security Audit"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Report Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="security_summary">Security Summary</option>
                  <option value="compliance_audit">Compliance Audit</option>
                  <option value="threat_incident">Threat Incident Analysis</option>
                  <option value="executive_brief">Executive Brief</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Executive Summary / Brief
                </label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Summarize key risk vectors, mitigation results, and incident counts..."
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setShowGenerateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
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
