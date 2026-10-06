import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Server, ShieldAlert, AlertTriangle,
  BarChart3, Bell, FileText, Settings, User, ChevronLeft, ChevronRight,
  Shield, LogOut,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/servers', icon: Server, label: 'Servers' },
  { to: '/threats', icon: ShieldAlert, label: 'Threat Monitor' },
  { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/alerts', icon: Bell, label: 'Alerts', badge: true },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/profile', icon: User, label: 'Profile' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchUnread = () => {
      api.getAlerts().then((alerts) => {
        const count = alerts.filter((a) => !a.read).length;
        setUnreadCount(count);
      }).catch(console.error);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  const getUserDisplayName = () => {
    if (!user) return 'Security Analyst';
    if (user.name && user.name.trim().length > 2) return user.name;
    if (user.email) {
      const emailName = user.email.split('@')[0];
      if (emailName.toLowerCase().startsWith('mdsuhail')) return 'Md Suhail';
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return user.name || 'Admin';
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 h-full z-40 flex flex-col border-r border-blue-500/10 bg-[#0a0e1a]/95 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 px-5 py-6 border-b border-blue-500/10 overflow-hidden">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shrink-0 shadow-lg shadow-blue-500/20 neon-border-blue">
          <Shield size={22} className="text-white" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex-1 min-w-0"
          >
            <h1 className="text-base font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
              ThreatX
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Security Engine</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group overflow-hidden ${
                isActive
                  ? 'bg-white/10 text-white font-semibold border-l-2 border-cyan-400 shadow-sm'
                  : 'text-slate-300 font-medium hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={19}
                  className={`shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate">{label}</span>
                )}
                {!collapsed && badge && unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold animate-pulse">
                    {unreadCount}
                  </span>
                )}
                {collapsed && badge && unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile & Logout Footer */}
      <div className="p-3 border-t border-blue-500/10 space-y-1">
        {!collapsed && user && (
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-blue-500/10 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm border border-blue-400/20">
                {getUserInitial()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-100 truncate">{getUserDisplayName()}</p>
                <p className="text-[10px] text-cyan-400 font-semibold uppercase font-mono tracking-wider">
                  {user.role || 'analyst'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
        {collapsed && (
          <button
            onClick={logout}
            title="Sign Out"
            className="w-full p-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        )}

        <button
          onClick={onToggle}
          className="w-full p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.aside>
  );
}

