import { Mail, Shield, Laptop, Activity, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import Topbar from '../components/Topbar';
import Button from '../components/ui/Button';
import { api } from '../services/api';
import type { ThreatEvent } from '../types';

export default function Profile() {
  const [name, setName] = useState('Admin User');
  const [activities, setActivities] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [sessions] = useState([
    { id: 's1', device: 'Chrome / Windows 11', ip: '192.168.1.120', status: 'Active Now' },
    { id: 's2', device: 'Safari / iPhone 15', ip: '172.16.2.40', status: '2 hours ago' },
  ]);

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    api
      .getEvents({ limit: 5 })
      .then((events: ThreatEvent[]) => {
        const list = events.slice(0, 4).map((e: ThreatEvent) => `Inspected threat event details for user ${e.username}`);
        setActivities(['Manually updated security policy sensitivity threshold', ...list]);
      })
      .catch(console.error);
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <Topbar
        title="Administrator Profile"
        subtitle="Manage your administrator credentials, active terminals & security audit history"
      />

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-500 text-xs flex items-center gap-2">
          <Check size={18} className="text-emerald-600" /> Profile settings updated successfully.
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        <div className="p-6 rounded-2xl bg-white border border-gray-200  shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-300 flex items-center justify-center text-xl font-bold text-blue-500 shadow-sm">
              {getInitials(name)}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{name}</h3>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Security Administrator</p>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 font-mono">
                <Mail size={13} className="text-blue-600" /> admin@threatx.io
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Role Assignment</label>
              <input
                defaultValue="Security Administrator"
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50/40 border border-gray-200 text-xs text-gray-400 cursor-not-allowed font-mono"
              />
            </div>
          </div>
        </div>

        {/* Audit Log Activity for this user */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200  shadow-xl">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Activity size={18} />
            </div>
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Recent Operations Audit</h3>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {activities.map((act, idx) => (
              <div key={idx} className="flex gap-2.5 items-start text-xs border-b border-gray-200 pb-2.5 last:border-0 last:pb-0">
                <span className="text-blue-600 font-bold">»</span>
                <p className="text-gray-600 leading-relaxed">{act}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions manager */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200  shadow-xl">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Laptop size={18} />
            </div>
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Active Session Terminals</h3>
          </div>
          <div className="space-y-2.5">
            {sessions.map((s) => (
              <div key={s.id} className="flex justify-between items-center p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <div>
                  <p className="font-bold text-gray-900">{s.device}</p>
                  <p className="font-mono text-blue-500 mt-0.5 text-[11px]">{s.ip}</p>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    s.status === 'Active Now'
                      ? 'bg-emerald-50 text-emerald-500 border-emerald-500/40'
                      : 'bg-gray-100 text-gray-500 border-gray-300'
                  }`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200  shadow-xl">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-500/30">
              <Shield size={18} />
            </div>
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Security MFA</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <p className="text-xs font-bold text-gray-900">Two-Factor Authentication</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Enabled via TOTP Authenticator App</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-500 border border-emerald-500/40">
                Active
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
        >
          Update Profile Settings
        </Button>
      </div>
    </div>
  );
}
