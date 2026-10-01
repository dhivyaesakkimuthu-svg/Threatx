import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Server, ShieldAlert, AlertTriangle,
  BarChart3, Bell, FileText, Settings, User, ChevronLeft, ChevronRight,
  Shield,
} from 'lucide-react';
import { api } from '../../api/client';

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
            <h1 className="text-lg font-extrabold bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
              ThreatX
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Security Engine</p>
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
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${
                isActive
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-glow"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={20} className="shrink-0 transition-transform group-hover:scale-110" />
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

      <button
        onClick={onToggle}
        className="mx-3 mb-4 p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all flex items-center justify-center"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </motion.aside>
  );
}
