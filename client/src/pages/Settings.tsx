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
    <div className="space-y-6 relative animate-fade-in pb-12">
      <Topbar
        title="System Settings & Security Policies"
        subtitle="Manage cluster configuration, active REST gateways, alerting policies and user preferences"
      />

      {/* Save Settings Confirmation Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-gray-900 font-bold px-4 py-3 rounded-2xl border border-emerald-400 shadow-lg flex items-center gap-2 animate-fade-in text-xs">
          <Check size={18} /> Configuration Saved &amp; Synchronized Successfully!
        </div>
      )}

      {/* Tab Navigation - Dark Theme */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-gray-200  shadow-xl overflow-x-auto">
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-gray-900 shadow-lg shadow-blue-500/20'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents - Dark Theme */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TAB 1: SYSTEM & ARCHITECTURE */}
        {activeTab === 'system' && (
          <>
            <div className="rounded-2xl bg-white border border-gray-200  p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Server size={20} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm tracking-wide">
                  Active ThreatX Cluster Topology
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Central REST API</span>
                    <span className="text-gray-900 font-bold text-xs">Express.js (Node.js)</span>
                  </div>
                  <span className="text-emerald-600 bg-emerald-50 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold font-mono">
                    Port 3001 Active
                  </span>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Telemetry Simulation</span>
                    <span className="text-gray-900 font-bold text-xs">Python Flask Demo Engine</span>
                  </div>
                  <span className="text-emerald-600 bg-emerald-50 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold font-mono">
                    Port 5001 Active
                  </span>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">Primary Datastore</span>
                    <span className="text-gray-900 font-bold text-xs">MongoDB (threatx_db)</span>
                  </div>
                  <span className="text-emerald-600 bg-emerald-50 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold font-mono">
                    Port 27017 Connected
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-gray-200  p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Radio size={20} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm tracking-wide">
                  Real-time Channels &amp; Socket.IO
                </h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Bi-directional Socket.IO event bus configured on the Express HTTP server for instantaneous push updates on threat detections, agent heartbeats, and user session changes.
              </p>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono space-y-2.5">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Transport:</span>
                  <span className="text-gray-900 font-bold">WebSocket / Polling Fallback</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Cors Origin:</span>
                  <span className="text-blue-500 font-bold">http://localhost:5173</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Heartbeat Interval:</span>
                  <span className="text-emerald-600 font-bold">5000 ms</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: API & GATEWAY */}
        {activeTab === 'api' && (
          <>
            <div className="rounded-2xl bg-white border border-gray-200  p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Globe size={20} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm tracking-wide">
                  API Endpoints &amp; Gateways
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                    Central API Endpoint URL (Read-only)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="http://localhost:3001"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-mono text-blue-500 select-all focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                    Python Demo Telemetry URL (Read-only)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="http://localhost:5001"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-mono text-blue-500 select-all focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                    Database URI (Read-only)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="mongodb://127.0.0.1:27017/threatx_db"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-mono text-blue-500 select-all focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-gray-200  p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 border border-amber-500/30">
                  <Key size={20} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm tracking-wide">
                  Agent Authentication Tokens
                </h3>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] text-gray-500 uppercase block font-sans font-bold">
                    Demo Server Agent Key
                  </span>
                  <p className="text-blue-500 text-xs mt-1.5 break-all select-all font-mono font-bold">
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
            <div className="rounded-2xl bg-white border border-gray-200  p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  <Shield size={20} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm tracking-wide">
                  Detection Sensitivity &amp; Heuristics
                </h3>
              </div>
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-gray-700">Risk Score Anomaly Threshold</span>
                    <span className="font-mono text-blue-500 font-black text-sm">{riskThreshold}/100</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="90"
                    value={riskThreshold}
                    onChange={(e) => setRiskThreshold(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-gray-500 font-mono mt-1">
                    <span>40 (High Sensitivity)</span>
                    <span>70 (Balanced)</span>
                    <span>90 (Strict)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1.5">
                    Brute Force Consecutive Threshold
                  </label>
                  <select
                    value={failedLoginLimit}
                    onChange={(e) => setFailedLoginLimit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option>3 attempts</option>
                    <option>5 attempts</option>
                    <option>10 attempts</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="font-bold text-gray-700 block">Geographical Impossible Travel</span>
                    <span className="text-[11px] text-gray-500">Flag concurrent logins across different countries</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={impossibleTravel}
                    onChange={(e) => setImpossibleTravel(e.target.checked)}
                    className="accent-cyan-400 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-gray-200  p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200 mb-4">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                    <Lock size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm tracking-wide">
                    Automated Mitigation Rules
                  </h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="font-bold text-gray-900 block mb-0.5">Automated IP Subnet Dropping</span>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Automatically execute temporary iptables drop rules when brute-force thresholds are exceeded.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="font-bold text-gray-900 block mb-0.5">Session Revocation Engine</span>
                    <p className="text-xs text-gray-600 leading-relaxed">
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
          <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-200  p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Bell size={20} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm tracking-wide">
                Alert Dispatch &amp; Webhook Channels
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">Critical Email Notifications</span>
                  <span className="text-xs text-gray-500">Send alerts to SOC analyst distribution list</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">Slack Incident Channel Webhook</span>
                  <span className="text-xs text-gray-500">Post high &amp; critical vectors to #threat-alerts</span>
                </div>
                <input
                  type="checkbox"
                  checked={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.checked)}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={saveSettings}
              >
                Save Notifications
              </Button>
            </div>
          </div>
        )}

        {/* TAB 5: PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-200  p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Sliders size={20} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm tracking-wide">
                Console Appearance &amp; Telemetry Refresh
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">Telemetry Auto-Refresh</span>
                  <span className="text-xs text-gray-500">Polling rate for Python demo server</span>
                </div>
                <select
                  value={pollInterval}
                  onChange={(e) => setPollInterval(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="3">3 seconds</option>
                  <option value="5">5 seconds (Recommended)</option>
                  <option value="10">10 seconds</option>
                </select>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">Auditory Critical Warnings</span>
                  <span className="text-xs text-gray-500">Play alert tone on severity elevation</span>
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

            <div className="pt-3 border-t border-gray-200 flex justify-end">
              <Button
                variant="primary"
                size="md"
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
