import { useState } from 'react';
import { Bell, Shield, Mail, Globe, Key, Check } from 'lucide-react';
import Header from '../components/layout/Header';
import GlassCard from '../components/ui/GlassCard';

export default function Settings() {
  const [showToast, setShowToast] = useState(false);
  const [apiKeyList, setApiKeyList] = useState([
    { id: '1', name: 'SIEM integration API', key: 'tx_32a1f496de2b988f00...', created: '2026-06-12' },
    { id: '2', name: 'SOAR automation engine', key: 'tx_fe3922c0e817aefb98...', created: '2026-07-01' },
  ]);

  const saveSettings = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-6 relative">
      <Header title="System Settings" subtitle="Configure system rules, access keys, and alerting rules" />

      {/* Save Settings confirmation toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl border border-emerald-400 shadow-lg shadow-emerald-500/20 flex items-center gap-2 animate-fade-in">
          <Check size={16} /> Configuration Saved Successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        <GlassCard>
          <div className="flex items-center gap-2.5 mb-4">
            <Shield size={18} className="text-blue-400" />
            <h3 className="font-extrabold text-slate-200 uppercase tracking-wider text-xs">Detection Sensitivity</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400">Risk Score Threshold (High)</label>
              <input type="range" min="50" max="90" defaultValue="70" className="w-full mt-1.5 accent-blue-500" />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono"><span>50</span><span>70</span><span>90</span></div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400">Failed Login Threshold</label>
              <select className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-black/40 border border-blue-500/15 text-xs text-slate-300 focus:outline-none">
                <option>3 attempts</option>
                <option>5 attempts</option>
                <option>10 attempts</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-400 font-semibold">Enable impossible travel detection</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-400 font-semibold">Monitor restricted folder access</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2.5 mb-4">
            <Bell size={18} className="text-cyan-400" />
            <h3 className="font-extrabold text-slate-200 uppercase tracking-wider text-xs">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-2"><Mail size={14} className="text-slate-600" /> Email alerts for high-risk events</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Slack webhook alert feed</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Auto-create incidents for high-risk</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </GlassCard>

        {/* API Key management section */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <Key size={18} className="text-amber-400" />
            <h3 className="font-extrabold text-slate-200 uppercase tracking-wider text-xs">Access Keys (API)</h3>
          </div>
          <div className="space-y-3">
            {apiKeyList.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-black/35 border border-blue-500/5 text-xs">
                <div>
                  <p className="font-bold text-slate-200">{item.name}</p>
                  <p className="font-mono text-slate-500 mt-1 text-[10px]">{item.key}</p>
                </div>
                <span className="text-[10px] text-slate-600 font-bold">Created: {item.created}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <Globe size={18} className="text-emerald-400" />
            <h3 className="font-extrabold text-slate-200 uppercase tracking-wider text-xs">Organization settings</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Organization Name</label>
              <input defaultValue="Acme Corporation" className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-black/40 border border-blue-500/15 text-xs text-slate-300 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">System Timezone</label>
              <select className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-black/40 border border-blue-500/15 text-xs text-slate-300 focus:outline-none">
                <option>UTC+5:30 (IST)</option>
                <option>UTC+0 (GMT)</option>
                <option>UTC-5 (EST)</option>
              </select>
            </div>
          </div>
          <button
            onClick={saveSettings}
            className="mt-6 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-lg shadow-blue-600/15"
          >
            Save settings config
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
