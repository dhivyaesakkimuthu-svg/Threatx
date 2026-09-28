import { useEffect, useState, useRef } from 'react';
import { Bell, Search, ShieldAlert, Check } from 'lucide-react';
import { api } from '../../api/client';
import type { Alert } from '../../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="flex items-center justify-between mb-8 relative">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#172033]">{title}</h2>
        {subtitle && <p className="text-xs text-[#667085] mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Monitoring status */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-semibold text-[#059669]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span>LIVE MONITORING</span>
        </div>

        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
          <input
            type="text"
            placeholder="Search console..."
            className="pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] w-56 transition-all"
          />
        </div>

        {/* Alerts Dropdown Wrapper */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 rounded-lg bg-white border border-[#E4E7EC] hover:bg-[#F8FAFC] text-[#667085] hover:text-[#172033] transition-all cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Mini Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#E4E7EC] bg-white shadow-xl p-3 z-50 animate-fade-in">
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#E4E7EC]">
                <span className="text-xs font-semibold text-[#172033]">Recent Alerts</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2] px-2 py-0.5 rounded-full font-semibold">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {unreadAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] flex items-start gap-2">
                    <ShieldAlert size={14} className="text-[#DC2626] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-[#172033]">{alert.title}</p>
                      <p className="text-[11px] text-[#667085] line-clamp-2 mt-0.5">{alert.message}</p>
                    </div>
                    <button
                      onClick={(e) => markAsRead(alert.id, e)}
                      className="p-1 hover:bg-white rounded text-[#667085] hover:text-[#059669]"
                      title="Mark as read"
                      aria-label="Mark as read"
                    >
                      <Check size={12} />
                    </button>
                  </div>
                ))}
                {unreadCount === 0 && (
                  <div className="text-center py-6 text-xs text-[#667085]">
                    All clear! No unread alerts.
                  </div>
                )}
              </div>
              <div className="mt-2.5 pt-2 border-t border-[#E4E7EC] text-center">
                <a href="/alerts" className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold">
                  View All Alerts
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xs font-bold border border-[#DBEAFE]">
          TX
        </div>
      </div>
    </header>
  );
}
