import { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  X,
  Server,
  Key,
  Flame,
  Activity,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import SeverityBadge from './ui/SeverityBadge';

interface DemoScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioTriggered?: (scenarioName: string) => void;
}

interface ScenarioItem {
  id: string;
  name: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info';
  description: string;
  simulatedEvent: string;
  expectedOutcome: string;
}

export default function DemoScenarioModal({
  isOpen,
  onClose,
  onScenarioTriggered,
}: DemoScenarioModalProps) {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [activeTab, setActiveTab] = useState<'scenarios' | 'reset'>('scenarios');
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getDemoScenarios()
        .then((res: any) => {
          if (res?.scenarios) {
            setScenarios(res.scenarios);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunScenario = async (scenarioId: string, scenarioName: string) => {
    setIsExecuting(scenarioId);
    setExecutionResult(null);
    try {
      const res = await api.triggerDemoScenario(scenarioId);
      setExecutionResult({
        success: true,
        scenarioName,
        message: res.message || 'Scenario executed. Real-time telemetry broadcasted.',
        summary: res.summary,
      });
      if (onScenarioTriggered) {
        onScenarioTriggered(scenarioName);
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        scenarioName,
        message: err?.response?.data?.message || err.message || 'Failed to execute scenario.',
      });
    } finally {
      setIsExecuting(null);
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    setResetSuccess(false);
    try {
      await api.resetDemoData();
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        onClose();
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      alert('Failed to reset demo data: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsResetting(false);
    }
  };

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'critical-threat':
        return <Flame className="w-5 h-5 text-red-600" />;
      case 'suspicious-login':
        return <Key className="w-5 h-5 text-orange-600" />;
      case 'resource-anomaly':
        return <Server className="w-5 h-5 text-amber-600" />;
      case 'high-risk-event':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <Activity className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Demo Scenarios & Event Simulator
              </h2>
              <p className="text-xs text-slate-500">
                Trigger controlled attack simulations and inspect live SOC responses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close demo modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-white px-5 pt-2">
          <button
            onClick={() => {
              setActiveTab('scenarios');
              setExecutionResult(null);
            }}
            className={`pb-3 px-3 font-semibold text-xs transition-all border-b-2 cursor-pointer ${
              activeTab === 'scenarios'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Interactive Attack Scenarios
          </button>
          <button
            onClick={() => {
              setActiveTab('reset');
              setExecutionResult(null);
            }}
            className={`pb-3 px-3 font-semibold text-xs transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reset'
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw size={12} />
            Safe Demo Reset
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Active Result Banner */}
          {executionResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${
                executionResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {executionResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-bold">{executionResult.scenarioName} Triggered</p>
                <p className="mt-0.5 text-slate-600 leading-relaxed">{executionResult.message}</p>
                {executionResult.summary && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 font-mono text-[11px] text-emerald-800">
                    <span>Target: {executionResult.summary.targetServer || 'SRV-001'}</span> •{' '}
                    <span>Severity: {executionResult.summary.severity}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'scenarios' ? (
            <div className="space-y-3">
              {scenarios.map((sc) => (
                <div
                  key={sc.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                      {getScenarioIcon(sc.id)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">{sc.name}</span>
                        <SeverityBadge severity={sc.severity} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{sc.description}</p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                        <span>Event: {sc.simulatedEvent}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={isExecuting !== null}
                    onClick={() => handleRunScenario(sc.id, sc.name)}
                    className="self-end sm:self-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isExecuting === sc.id ? (
                      <span className="inline-block animate-spin">⟳</span>
                    ) : (
                      <Play size={12} className="fill-current" />
                    )}
                    <span>{isExecuting === sc.id ? 'Simulating...' : 'Execute'}</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Reset Tab */
            <div className="space-y-4 p-2 text-xs">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Restore Clean Baseline State</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  This action purges all simulated threats, injected anomalies, and dynamic alarms generated during testing, reseeding deterministic baseline records in MongoDB.
                </p>
              </div>

              {resetSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 font-bold text-xs">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>Baseline restored successfully. Reloading workspace...</span>
                </div>
              ) : (
                <div className="flex justify-end pt-2">
                  <button
                    disabled={isResetting}
                    onClick={handleResetData}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={14} className={isResetting ? 'animate-spin' : ''} />
                    <span>{isResetting ? 'Restoring Baseline...' : 'Confirm Safe Demo Reset'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
