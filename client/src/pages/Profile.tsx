import { Mail, Shield, Laptop, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import GlassCard from '../components/ui/GlassCard';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || 'Security Admin');
  const [activities, setActivities] = useState<string[]>([]);
  const [sessions] = useState([
    { id: 's1', device: 'Chrome / Windows 11', ip: '192.168.1.120', status: 'Active Now' },
    { id: 's2', device: 'Safari / iPhone 15', ip: '172.16.2.40', status: '2 hours ago' },
  ]);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  // Generate initials for avatar representation
  const getInitials = (n: string) => {
    return n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  useEffect(() => {
    api.getEvents({ limit: 5 }).then((events) => {
      // Create some mock admin activity logs based on actual events
      const list = events.slice(0, 4).map(e => `Inspected threat event details for user ${e.username}`);
      setActivities(['Manually updated security policy sensitivity threshold', ...list]);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <Header title="Administrator Profile" subtitle="Manage your administrator credentials & log audits" />

      <div className="max-w-2xl space-y-6">
        <GlassCard>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-blue-500/20 border border-blue-400/20">
              {getInitials(name || 'Admin')}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{name}</h3>
              <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">
                {user?.role || 'admin'} role
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                <Mail size={13} className="text-slate-500" /> {user?.email || 'admin@threatx.io'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Role Assignment</label>
              <input value={user?.role ? `${user.role.toUpperCase()} (Threat Analyst)` : 'ADMIN (Security Administrator)'} disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-sm text-slate-400 opacity-60 cursor-not-allowed" />
            </div>
          </div>
        </GlassCard>

        {/* Audit Log Activity for this user */}
        <GlassCard>
          <div className="flex items-center gap-2.5 mb-4">
            <Activity size={18} className="text-cyan-400" />
            <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">Recent Operations Audit</h3>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {activities.map((act, idx) => (
              <div key={idx} className="flex gap-2.5 items-start text-xs border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                <span className="text-cyan-400 font-bold">»</span>
                <p className="text-slate-300 leading-relaxed">{act}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Sessions manager */}
        <GlassCard>
          <div className="flex items-center gap-2.5 mb-4">
            <Laptop size={18} className="text-blue-400" />
            <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">Active Session Terminals</h3>
          </div>
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="flex justify-between items-center p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{s.device}</p>
                  <p className="font-mono text-cyan-300 mt-0.5 text-xs">{s.ip}</p>
                </div>
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${s.status === 'Active Now' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2.5 mb-4">
            <Shield size={18} className="text-emerald-400" />
            <h3 className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">Security MFA</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <div>
                <p className="text-xs font-semibold text-slate-200">Two-Factor Authentication</p>
                <p className="text-xs text-slate-400 mt-0.5">Enabled via TOTP Authenticator App</p>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
            </div>
          </div>
        </GlassCard>

        <button className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-lg shadow-blue-600/15 cursor-pointer">
          Update profile settings
        </button>
      </div>
    </div>
  );
}
