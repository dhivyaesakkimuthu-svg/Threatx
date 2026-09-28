import { useState } from 'react';
import {
  Bell,
  Shield,
  Globe,
  Key,
  Check,
  Server,
  Radio,
  Sliders,
  Lock,
} from 'lucide-react';
import Topbar from '../components/Topbar';
import Button from '../components/ui/Button';

export default function Settings() {
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'api' | 'notifications' | 'security' | 'preferences'>('system');
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [failedLoginLimit, setFailedLoginLimit] = useState('5 attempts');
  const [impossibleTravel, setImpossibleTravel] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackWebhook, setSlackWebhook] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pollInterval, setPollInterval] = useState('5');

  const saveSettings = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-6 relative animate-fade-in">
      <Topbar
        title="System Settings & Security Policies"
        subtitle="Manage cluster configuration, active REST gateways, alerting policies and user preferences"
      />

      {/* Save Settings Confirmation Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#059669] text-white font-semibold px-4 py-2.5 rounded-xl border border-[#10B981] shadow-lg flex items-center gap-2 animate-fade-in text-xs">
          <Check size={16} /> Configuration Saved & Synchronized Successfully!
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-[#E4E7EC] shadow-sm overflow-x-auto">
        {[
          { id: 'system', label: 'System & Architecture', icon: Server },
          { id: 'api', label: 'API & Gateway', icon: Globe },
          { id: 'security', label: 'Security & Detection', icon: Shield },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'preferences', label: 'User Preferences', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#667085] hover:text-[#172033] hover:bg-[#F8FAFC]'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TAB 1: SYSTEM & ARCHITECTURE */}
        {activeTab === 'system' && (
          <>
            <div className="rounded-xl bg-white border border-[#E4E7EC] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#E4E7EC]">
                <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <Server size={18} />
                </div>
                <h3 className="font-bold text-[#172033] text-sm">
                  Active ThreatX Cluster Topology
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E4E7EC] flex justify-between items-center">
                  <div>
                    <span className="text-[#667085] block text-[10px] uppercase font-semibold">Central REST API</span>
                    <span className="text-[#172033] font-bold">Express.js (Node.js)</span>
                  </div>
                  <span className="text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                    Port 3001 Active
                  </span>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E4E7EC] flex justify-between items-center">
                  <div>
                    <span className="text-[#667085] block text-[10px] uppercase font-semibold">Telemetry Simulation</span>
                    <span className="text-[#172033] font-bold">Python Flask Demo Engine</span>
                  </div>
                  <span className="text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                    Port 5001 Active
                  </span>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E4E7EC] flex justify-between items-center">
                  <div>
                    <span className="text-[#667085] block text-[10px] uppercase font-semibold">Primary Datastore</span>
                    <span className="text-[#172033] font-bold">MongoDB (threatx_db)</span>
                  </div>
                  <span className="text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                    Port 27017 Connected
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-[#E4E7EC] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#E4E7EC]">
                <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <Radio size={18} />
                </div>
                <h3 className="font-bold text-[#172033] text-sm">
                  Real-time Channels & Socket.IO
                </h3>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed">
                Bi-directional Socket.IO event bus configured on the Express HTTP server for instantaneous push updates on threat detections, agent heartbeats, and user session changes.
              </p>
              <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E4E7EC] text-xs font-mono space-y-2">
                <div className="flex justify-between py-1 border-b border-[#E4E7EC]">
                  <span className="text-[#667085]">Transport:</span>
                  <span className="text-[#172033] font-medium">WebSocket / Polling Fallback</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E4E7EC]">
                  <span className="text-[#667085]">Cors Origin:</span>
                  <span className="text-[#172033] font-medium">http://localhost:5173</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#667085]">Heartbeat Interval:</span>
                  <span className="text-[#059669] font-bold">5000 ms</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: API & GATEWAY */}
        {activeTab === 'api' && (
          <>
            <div className="rounded-xl bg-white border border-[#E4E7EC] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#E4E7EC]">
                <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <Globe size={18} />
                </div>
                <h3 className="font-bold text-[#172033] text-sm">
                  API Endpoints & Gateways
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-xs font-semibold text-[#667085] uppercase tracking-wider block mb-1">
                    Central API Endpoint URL (Read-only)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="http://localhost:3001"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] font-mono text-[#172033] select-all focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#667085] uppercase tracking-wider block mb-1">
                    Python Demo Telemetry URL (Read-only)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="http://localhost:5001"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] font-mono text-[#172033] select-all focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#667085] uppercase tracking-wider block mb-1">
                    Database URI (Read-only)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="mongodb://127.0.0.1:27017/threatx_db"
                    className="w-full px-3.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] font-mono text-[#172033] select-all focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-[#E4E7EC] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#E4E7EC]">
                <div className="p-2 rounded-lg bg-[#FFFBEB] text-[#D97706]">
                  <Key size={18} />
                </div>
                <h3 className="font-bold text-[#172033] text-sm">
                  Agent Authentication Tokens
                </h3>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E4E7EC]">
                  <span className="text-[10px] text-[#667085] uppercase block font-sans font-semibold">
                    Demo Server Agent Key
                  </span>
                  <p className="text-[#172033] text-xs mt-1 break-all select-all font-mono font-medium">
                    tx_227c2920cc9599872b69f6fcf5db4e7a877ff217a8476e0b
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 3: SECURITY & DETECTION */}
        {activeTab === 'security' && (
          <>
            <div className="rounded-xl bg-white border border-[#E4E7EC] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#E4E7EC]">
                <div className="p-2 rounded-lg bg-[#FEF2F2] text-[#DC2626]">
                  <Shield size={18} />
                </div>
                <h3 className="font-bold text-[#172033] text-sm">
                  Detection Sensitivity & Heuristics
                </h3>
              </div>
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-[#172033]">Risk Score Anomaly Threshold</span>
                    <span className="font-mono text-[#2563EB] font-bold">{riskThreshold}/100</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="90"
                    value={riskThreshold}
                    onChange={(e) => setRiskThreshold(Number(e.target.value))}
                    className="w-full accent-[#2563EB] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#667085] font-mono mt-1">
                    <span>40 (High Sensitivity)</span>
                    <span>70 (Balanced)</span>
                    <span>90 (Strict)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[#172033] font-semibold mb-1.5">
                    Brute Force Consecutive Threshold
                  </label>
                  <select
                    value={failedLoginLimit}
                    onChange={(e) => setFailedLoginLimit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  >
                    <option>3 attempts</option>
                    <option>5 attempts</option>
                    <option>10 attempts</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="font-semibold text-[#172033] block">Geographical Impossible Travel</span>
                    <span className="text-[11px] text-[#667085]">Flag concurrent logins across different countries</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={impossibleTravel}
                    onChange={(e) => setImpossibleTravel(e.target.checked)}
                    className="accent-[#2563EB] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-[#E4E7EC] p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E4E7EC] mb-4">
                  <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                    <Lock size={18} />
                  </div>
                  <h3 className="font-bold text-[#172033] text-sm">
                    Automated Mitigation Rules
                  </h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E4E7EC]">
                    <span className="font-semibold text-[#172033] block mb-0.5">Automated IP Subnet Dropping</span>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      Automatically execute temporary iptables drop rules when brute-force thresholds are exceeded.
                    </p>
                  </div>
                  <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E4E7EC]">
                    <span className="font-semibold text-[#172033] block mb-0.5">Session Revocation Engine</span>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      Terminate active SSH and web tokens upon confirmed unauthorized privilege escalation attempts.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={saveSettings}
                className="mt-4 w-full"
              >
                Apply Security Policies
              </Button>
            </div>
          </>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="lg:col-span-2 rounded-xl bg-white border border-[#E4E7EC] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E4E7EC]">
              <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                <Bell size={18} />
              </div>
              <h3 className="font-bold text-[#172033] text-sm">
                Alert Dispatch & Webhook Channels
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E4E7EC] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#172033] block">Critical Email Notifications</span>
                  <span className="text-[11px] text-[#667085]">Send alerts to SOC analyst distribution list</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="accent-[#2563EB] w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E4E7EC] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#172033] block">Slack Incident Channel Webhook</span>
                  <span className="text-[11px] text-[#667085]">Post high & critical vectors to #threat-alerts</span>
                </div>
                <input
                  type="checkbox"
                  checked={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.checked)}
                  className="accent-[#2563EB] w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E4E7EC] flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={saveSettings}
              >
                Save Notifications
              </Button>
            </div>
          </div>
        )}

        {/* TAB 5: PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="lg:col-span-2 rounded-xl bg-white border border-[#E4E7EC] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E4E7EC]">
              <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                <Sliders size={18} />
              </div>
              <h3 className="font-bold text-[#172033] text-sm">
                Console Appearance & Telemetry Refresh
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E4E7EC] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#172033] block">Telemetry Auto-Refresh</span>
                  <span className="text-[11px] text-[#667085]">Polling rate for Python demo server</span>
                </div>
                <select
                  value={pollInterval}
                  onChange={(e) => setPollInterval(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                >
                  <option value="3">3 seconds</option>
                  <option value="5">5 seconds (Recommended)</option>
                  <option value="10">10 seconds</option>
                </select>
              </div>

              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E4E7EC] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#172033] block">Auditory Critical Warnings</span>
                  <span className="text-[11px] text-[#667085]">Play alert tone on severity elevation</span>
                </div>
                <Button
                  variant={soundEnabled ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? 'Enabled' : 'Muted'}
                </Button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E4E7EC] flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={saveSettings}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
