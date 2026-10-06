import { useState } from 'react';
import { Bell, Shield, Mail, Globe, Key, Check } from 'lucide-react';
import Header from '../components/layout/Header';
import GlassCard from '../components/ui/GlassCard';

export default function Settings() {
  const [showToast, setShowToast] = useState(false);
  const [apiKeyList] = useState([
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
            <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">Detection Sensitivity</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Risk Score Threshold (High)</label>
              <input type="range" min="50" max="90" defaultValue="70" className="w-full mt-2 accent-cyan-400 cursor-pointer" />
              <div className="flex justify-between text-xs text-slate-400 font-mono mt-1"><span>50</span><span>70</span><span>90</span></div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Failed Login Threshold</label>
              <select className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors">
                <option>3 attempts</option>
                <option>5 attempts</option>
                <option>10 attempts</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300 font-medium">Enable impossible travel detection</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300 font-medium">Monitor restricted folder access</span>
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
            <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-2"><Mail size={14} className="text-slate-400" /> Email alerts for high-risk events</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Slack webhook alert feed</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Auto-create incidents for high-risk</span>
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
            <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">Access Keys (API)</h3>
          </div>
          <div className="space-y-3">
            {apiKeyList.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{item.name}</p>
                  <p className="font-mono text-cyan-300 mt-1 text-xs">{item.key}</p>
                </div>
                <span className="text-xs text-slate-400 font-medium">Created: {item.created}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <Globe size={18} className="text-emerald-400" />
            <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">Organization settings</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Organization Name</label>
              <input defaultValue="Acme Corporation" className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">System Timezone</label>
              <select className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors">
                <option>UTC+5:30 (IST)</option>
                <option>UTC+0 (GMT)</option>
                <option>UTC-5 (EST)</option>
              </select>
            </div>
          </div>
          <button
            onClick={saveSettings}
            className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-lg shadow-blue-600/15 cursor-pointer"
          >
            Save settings config
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
