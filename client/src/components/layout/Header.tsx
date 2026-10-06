import { useEffect, useState, useRef } from 'react';
import { Bell, Search, ShieldAlert, Check, LogOut } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { Alert } from '../../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  const fetchAlerts = () => {
    api.getAlerts().then(setAlerts).catch(console.error);
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.read);
  const unreadCount = unreadAlerts.length;

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.markAlertRead(id);
    fetchAlerts();
  };

  const getInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'A';
  };

  return (
    <header className="flex items-center justify-between mb-8 relative">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm font-normal text-slate-400 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Pulsing monitoring status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>LIVE MONITORING ACTIVE</span>
        </div>

        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search console..."
            className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-blue-500/10 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.07] transition-all w-64"
          />
        </div>

        {/* Alerts Dropdown Wrapper */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2.5 rounded-xl bg-white/5 border border-blue-500/10 hover:border-blue-500/25 transition-all cursor-pointer"
          >
            <Bell size={18} className={unreadCount > 0 ? 'text-blue-400' : 'text-slate-400'} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Mini Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-blue-500/10 bg-[#0d1326]/95 backdrop-blur-xl shadow-2xl p-4 z-50 animate-fade-in">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-500/10">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Alerts</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {unreadAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="p-2.5 rounded-lg bg-white/[0.02] border border-blue-500/5 hover:border-blue-500/20 transition-all flex items-start gap-2.5">
                    <ShieldAlert size={14} className="text-red-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-slate-200">{alert.title}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{alert.message}</p>
                    </div>
                    <button
                      onClick={(e) => markAsRead(alert.id, e)}
                      className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-emerald-400"
                      title="Mark as read"
                    >
                      <Check size={12} />
                    </button>
                  </div>
                ))}
                {unreadCount === 0 && (
                  <div className="text-center py-6 text-xs text-slate-500">
                    All clear! No unread alerts.
                  </div>
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-blue-500/10 text-center">
                <a href="/alerts" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
                  View All Alerts
                </a>
              </div>
            </div>
          )}
        </div>

        {/* User badge & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div
            title={user?.email || 'Admin'}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/20 border border-blue-400/20"
          >
            {getInitial()}
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 border border-blue-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

