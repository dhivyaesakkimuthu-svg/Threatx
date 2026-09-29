import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Server, ShieldAlert, Users,
  BarChart3, FileText, Settings, ChevronLeft, ChevronRight,
  Shield, PlayCircle, ExternalLink, BrainCircuit,
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

  const navSections = [
    {
      title: 'CORE OPERATIONS',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'SOC Dashboard', roles: ['admin', 'analyst', 'viewer'] },
        { to: '/intelligence', icon: BrainCircuit, label: 'AI Intelligence & IOCs', roles: ['admin', 'analyst', 'viewer'] },
        { to: '/threats', icon: ShieldAlert, label: 'Threat Triage', badge: true, roles: ['admin', 'analyst', 'viewer'] },
        { to: '/alerts', icon: Bell, label: 'Security Alerts', roles: ['admin', 'analyst', 'viewer'] },
        { to: '/servers', icon: Server, label: 'Monitored Nodes', roles: ['admin', 'analyst', 'viewer'] },
        { to: '/sessions', icon: Users, label: 'Active Sessions', roles: ['admin', 'analyst'] },
      ],
    },
    {
      title: 'ANALYTICS & GOVERNANCE',
      items: [
        { to: '/analytics', icon: BarChart3, label: 'Threat Analytics', roles: ['admin', 'analyst', 'viewer'] },
        { to: '/reports', icon: FileText, label: 'Executive Reports', roles: ['admin', 'analyst'] },
        { to: '/users', icon: UserCheck, label: 'User Admin & RBAC', roles: ['admin'] },
        { to: '/audit-logs', icon: ScrollText, label: 'Immutable Audit Logs', roles: ['admin'] },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        { to: '/settings', icon: Settings, label: 'SOC Settings & APIs', roles: ['admin', 'analyst', 'viewer'] },
      ],
    },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 84 : 280 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 h-full z-40 flex flex-col bg-[#1B2A4A] shadow-xl"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3.5 px-5 py-5 border-b border-white/10 bg-[#162240]">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 via-cyan-500 to-teal-400 p-[1.5px] shadow-lg shrink-0">
          <div className="w-full h-full rounded-[14px] bg-[#1B2A4A] flex items-center justify-center text-cyan-300">
            <Shield size={22} />
          </div>
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            className="flex-1 min-w-0"
          >
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-wider font-mono">
                THREAT<span className="text-cyan-300">X</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-widest bg-cyan-400/15 text-cyan-200 border border-cyan-400/30">
                SOC v2.4
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">Cyber Operations</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-3.5 space-y-5 overflow-y-auto sidebar-scrollbar">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1.5">
              {!collapsed && (
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-blue-300/70 flex items-center gap-2">
                  <span>{section.title}</span>
                  <div className="flex-1 h-[1px] bg-white/10"></div>
                </div>
              )}

              {visibleItems.map(({ to, icon: Icon, label, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 group ${
                      isActive
                        ? 'bg-white/12 text-white border border-white/15 shadow-md'
                        : 'text-blue-100/80 hover:text-white hover:bg-white/8 border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full bg-cyan-400" />
                      )}

                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                          isActive
                            ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40'
                            : 'bg-white/8 text-blue-200/70 border border-white/8 group-hover:text-cyan-300 group-hover:border-cyan-400/30 group-hover:bg-white/12'
                        }`}
                      >
                        <Icon size={19} className="shrink-0" />
                      </div>

                      {!collapsed && (
                        <span className="truncate tracking-wide">{label}</span>
                      )}

                      {!collapsed && badge && unreadAlertsCount > 0 && (
                        <span className="ml-auto flex h-6 min-w-6 px-2 items-center justify-center rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/50 text-xs font-mono font-black animate-pulse">
                          {unreadAlertsCount}
                        </span>
                      )}
                      {collapsed && badge && unreadAlertsCount > 0 && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Target Simulator CTA */}
      <div className="px-3.5 py-3 border-t border-white/10 bg-[#162240]">
        <a
          href="http://localhost:5001/portal"
          target="_blank"
          rel="noopener noreferrer"
          title="Open OmniCorp Target Simulator Portal"
          className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-white/8 hover:bg-white/12 text-blue-100 hover:text-white border border-white/10 hover:border-cyan-400/30 text-[13px] font-bold transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform shrink-0">
            <PlayCircle size={18} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <div>
                <span className="block truncate text-white">Target Portal</span>
                <span className="block text-[10px] text-cyan-300/80 font-mono font-medium">Attack Simulation</span>
              </div>
              <ExternalLink size={14} className="text-blue-200/50 group-hover:text-cyan-300 shrink-0" />
            </div>
          )}
        </a>
      </div>

      {/* User Role & Collapse Control */}
      <div className="p-3.5 border-t border-white/10 flex items-center justify-between bg-[#142040]">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-lg bg-blue-400/20 border border-blue-400/30 flex items-center justify-center text-blue-300 text-xs font-bold font-mono">
              {role.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="uppercase font-extrabold text-white tracking-wider text-[11px] font-mono">
                  {user?.role || 'ADMIN'}
                </span>
              </div>
              <span className="text-[10px] text-blue-200/60 block truncate max-w-[120px]">{user?.email || 'admin@threatx.io'}</span>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center cursor-pointer ${
            collapsed ? 'w-full' : ''
          }`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.aside>
  );
}
