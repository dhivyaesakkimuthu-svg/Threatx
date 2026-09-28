import { Mail, Shield, Laptop, Activity, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import Topbar from '../components/Topbar';
import Button from '../components/ui/Button';
import { api } from '../api/client';

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
      .then((events) => {
        const list = events.slice(0, 4).map((e) => `Inspected threat event details for user ${e.username}`);
        setActivities(['Manually updated security policy sensitivity threshold', ...list]);
      })
      .catch(console.error);
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Topbar
        title="Administrator Profile"
        subtitle="Manage your administrator credentials, active terminals & security audit history"
      />

      {saved && (
        <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs flex items-center gap-2">
          <Check size={16} /> Profile settings updated successfully.
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        <div className="p-6 rounded-xl bg-white border border-[#E4E7EC] shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-xl font-bold text-[#2563EB]">
              {getInitials(name)}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033]">{name}</h3>
              <p className="text-xs text-[#2563EB] font-medium">Security Administrator</p>
              <p className="text-xs text-[#667085] flex items-center gap-1.5 mt-0.5 font-mono">
                <Mail size={12} className="text-[#98A2B3]" /> admin@company.com
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#172033] uppercase tracking-wider block mb-1">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#172033] uppercase tracking-wider block mb-1">Role Assignment</label>
              <input
                defaultValue="Security Administrator"
                disabled
                className="w-full px-3.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] text-xs text-[#667085] cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Audit Log Activity for this user */}
        <div className="p-5 rounded-xl bg-white border border-[#E4E7EC] shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
              <Activity size={16} />
            </div>
            <h3 className="font-bold text-[#172033] text-xs uppercase tracking-wider">Recent Operations Audit</h3>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {activities.map((act, idx) => (
              <div key={idx} className="flex gap-2.5 items-start text-xs border-b border-[#F1F4F9] pb-2.5 last:border-0 last:pb-0">
                <span className="text-[#2563EB] font-bold">»</span>
                <p className="text-[#475467] leading-relaxed">{act}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions manager */}
        <div className="p-5 rounded-xl bg-white border border-[#E4E7EC] shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
              <Laptop size={16} />
            </div>
            <h3 className="font-bold text-[#172033] text-xs uppercase tracking-wider">Active Session Terminals</h3>
          </div>
          <div className="space-y-2.5">
            {sessions.map((s) => (
              <div key={s.id} className="flex justify-between items-center p-3 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] text-xs">
                <div>
                  <p className="font-semibold text-[#172033]">{s.device}</p>
                  <p className="font-mono text-[#667085] mt-0.5 text-[11px]">{s.ip}</p>
                </div>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    s.status === 'Active Now'
                      ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                      : 'bg-[#F1F4F9] text-[#667085] border-[#E4E7EC]'
                  }`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E4E7EC] shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-1.5 rounded-lg bg-[#ECFDF5] text-[#059669]">
              <Shield size={16} />
            </div>
            <h3 className="font-bold text-[#172033] text-xs uppercase tracking-wider">Security MFA</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC]">
              <div>
                <p className="text-xs font-semibold text-[#172033]">Two-Factor Authentication</p>
                <p className="text-[11px] text-[#667085] mt-0.5">Enabled via TOTP Authenticator App</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
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
