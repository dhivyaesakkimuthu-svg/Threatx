import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Server, ShieldAlert, Users,
  BarChart3, FileText, Settings, ChevronLeft, ChevronRight,
  Shield, PlayCircle, ExternalLink, Activity, BrainCircuit,
  UserCheck, ScrollText, Bell,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Alert } from '../types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    const fetchUnread = () => {
      api.getAlerts().then((alerts: Alert[]) => {
        const count = Array.isArray(alerts) ? alerts.filter((a: Alert) => !a.read).length : 0;
        setUnreadAlertsCount(count);
      }).catch(() => null);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  const role = user?.role || 'viewer';

  // Role-based navigation items
  const allNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'analyst', 'viewer'] },
    { to: '/intelligence', icon: BrainCircuit, label: 'AI Intelligence', roles: ['admin', 'analyst', 'viewer'] },
    { to: '/threats', icon: ShieldAlert, label: 'Threats', badge: true, roles: ['admin', 'analyst', 'viewer'] },
    { to: '/alerts', icon: Bell, label: 'Alerts', roles: ['admin', 'analyst', 'viewer'] },
    { to: '/servers', icon: Server, label: 'Servers', roles: ['admin', 'analyst', 'viewer'] },
    { to: '/sessions', icon: Users, label: 'Sessions', roles: ['admin', 'analyst'] },
    { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin', 'analyst', 'viewer'] },
    { to: '/reports', icon: FileText, label: 'Reports', roles: ['admin', 'analyst'] },
    { to: '/users', icon: UserCheck, label: 'User Admin', roles: ['admin'] },
    { to: '/audit-logs', icon: ScrollText, label: 'Audit Logs', roles: ['admin'] },
    { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'analyst', 'viewer'] },
  ];

  const visibleNavItems = allNavItems.filter((item) => item.roles.includes(role));

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 260 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 h-full z-40 flex flex-col border-r border-[#E4E7EC] bg-white shadow-[0_1px_3px_0_rgba(16,24,40,0.05)]"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#E4E7EC] overflow-hidden">
        <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 shadow-sm flex items-center justify-center">
          <Shield size={20} />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            className="flex-1 min-w-0"
          >
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                THREATX
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                SOC
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Security Operations</p>
          </motion.div>
        )}
      </div>

      {/* Main Nav Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleNavItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate">{label}</span>
                )}
                {!collapsed && badge && unreadAlertsCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">
                    {unreadAlertsCount}
                  </span>
                )}
                {collapsed && badge && unreadAlertsCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Target Simulator Link */}
      <div className="px-3 py-3 border-t border-[#E4E7EC]">
        <a
          href="http://localhost:5001/portal"
          target="_blank"
          rel="noopener noreferrer"
          title="Open OmniCorp Target Simulator Portal"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all group"
        >
          <PlayCircle size={16} className="shrink-0 text-blue-600 group-hover:scale-105 transition-transform" />
          {!collapsed && (
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <span className="truncate">Demo Portal</span>
              <ExternalLink size={12} className="text-slate-400 group-hover:text-slate-600" />
            </div>
          )}
        </a>
      </div>

      {/* Role & Collapse Button */}
      <div className="p-3 border-t border-[#E4E7EC] flex items-center justify-between bg-slate-50/50">
        {!collapsed && (
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 px-2">
            <Activity size={12} className="text-emerald-600" />
            <span className="uppercase font-semibold text-slate-700">{user?.role || 'VIEWER'}</span>
          </div>
        )}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all flex items-center justify-center ${
            collapsed ? 'w-full' : ''
          }`}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}
