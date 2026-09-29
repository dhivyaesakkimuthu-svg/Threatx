import { useEffect, useState, useRef } from 'react';
import {
  Bell,
  Search,
  Shield,
  User,
  Clock,
  Activity,
  Database,
  Radio,
  Wifi,
  WifiOff,
  LogOut,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import StatusBadge, { type SystemStatusType } from './StatusBadge';
import AlertCenterDrawer from './AlertCenterDrawer';
import GlobalSearchModal from './GlobalSearchModal';
import DemoScenarioModal from './DemoScenarioModal';
import { api, type HealthData } from '../services/api';
import { subscribeToAlerts, subscribeToAlertUpdates, subscribeToConnectionState } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import type { Alert, ThreatEvent, Server } from '../types';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  connectionStatus?: SystemStatusType | string;
  lastUpdated?: string;
  showBrand?: boolean;
  onSelectThreat?: (threat: ThreatEvent) => void;
  onSelectServer?: (server: Server) => void;
}

export default function Topbar({
  title = 'Security Overview',
  subtitle,
  connectionStatus: propConnectionStatus,
  lastUpdated,
  showBrand = false,
  onSelectThreat,
  onSelectServer,
}: TopbarProps) {
  const { user, logout } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(true);
  const [showHealthTooltip, setShowHealthTooltip] = useState(false);
  const [showAlertDrawer, setShowAlertDrawer] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const healthRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const fetchAlertsAndHealth = async () => {
    try {
      const [alertsData, healthRes] = await Promise.all([
        api.getAlerts().catch(() => []),
        api.getHealth().catch(() => null),
      ]);
      setAlerts(alertsData || []);
      if (healthRes) setHealthData(healthRes);
    } catch (err) {
      console.warn('Topbar telemetry sync note:', err);
    }
  };

  useEffect(() => {
    fetchAlertsAndHealth();
    const interval = setInterval(fetchAlertsAndHealth, 10000);

    const unsubState = subscribeToConnectionState((connected) => {
      setIsSocketConnected(connected);
    });

    const unsubNewAlert = subscribeToAlerts((newAlert) => {
      setAlerts((prev) => [newAlert, ...prev.filter((a) => (a.alertId || a.id) !== (newAlert.alertId || newAlert.id))]);
    });

    const unsubAlertUpdate = subscribeToAlertUpdates((updated) => {
      setAlerts((prev) =>
        prev.map((a) => ((a.alertId || a.id) === (updated.alertId || updated.id) ? updated : a))
      );
    });

    // Keyboard shortcut for Cmd+K / Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      unsubState();
      unsubNewAlert();
      unsubAlertUpdate();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (healthRef.current && !healthRef.current.contains(event.target as Node)) {
        setShowHealthTooltip(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.read && a.status === 'open');
  const unreadCount = unreadAlerts.length;

  const handleAlertUpdated = (updated: Alert) => {
    setAlerts((prev) =>
      prev.map((a) => ((a.alertId || a.id) === (updated.alertId || updated.id) ? updated : a))
    );
  };

  const handleMarkAllRead = async () => {
    await api.markAllAlertsRead().catch(console.error);
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true, status: a.status === 'open' ? 'investigating' : a.status })));
  };

  // Determine overall connection status badge
  const dbStatusStr = typeof healthData?.database === 'object'
    ? (healthData?.database as any)?.status
    : healthData?.database;
  const demoStatusStr = typeof healthData?.demoServer === 'object'
    ? (healthData?.demoServer as any)?.status
    : healthData?.demoServer;

  const dbConnected = dbStatusStr === 'connected';
  const demoConnected = demoStatusStr === 'connected';
  const isOnline = dbConnected && isSocketConnected;
  const isDegraded = !demoConnected || demoStatusStr === 'degraded';

  const statusLabel = !isOnline ? 'offline' : isDegraded ? 'degraded' : (propConnectionStatus || 'online');

  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : 'SX';
  const userRole = user?.role || 'viewer';

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative pb-4 border-b border-gray-200">
        {/* Title Section */}
        <div className="flex items-center gap-3">
          {showBrand && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs tracking-wider text-blue-700 font-mono">
                THREATX
              </span>
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
              {title}
            </h1>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5 font-medium">{subtitle}</p>}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5 md:gap-3 self-end md:self-center">
          {/* Demo Scenario Controller Trigger */}
          <button
            onClick={() => setShowDemoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition-all cursor-pointer text-xs font-semibold"
            title="Launch Demo Attack Scenarios & Event Simulator"
          >
            <Zap size={14} className="text-blue-500" />
            <span>Attack Simulator</span>
          </button>

          {/* System Connection Status with Diagnostics Popup */}
          <div className="relative" ref={healthRef}>
            <button
              onClick={() => setShowHealthTooltip(!showHealthTooltip)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 transition-all cursor-pointer shadow-sm"
              title="Click to view SOC Cluster Health & Pipeline Diagnostics"
            >
              <span className="text-[11px] font-medium text-gray-500">Status:</span>
              <StatusBadge status={statusLabel} size="sm" />
            </button>

            {/* Health Diagnostics Popup */}
            {showHealthTooltip && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200 bg-white shadow-lg p-4 z-50 animate-fade-in space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <Activity size={14} className="text-blue-500" /> Pipeline Diagnostics
                  </span>
                  <span className="text-[11px] text-blue-600 font-mono">{healthData?.latencyMs ?? 12}ms</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Database size={13} className="text-blue-500" /> MongoDB
                    </span>
                    <span className={`font-semibold ${dbConnected ? 'text-emerald-600' : 'text-red-500'}`}>
                      {dbStatusStr || 'connected'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Radio size={13} className="text-amber-500" /> Demo Server :5001
                    </span>
                    <span
                      className={`font-semibold ${
                        demoConnected ? 'text-emerald-600' : isDegraded ? 'text-amber-500' : 'text-red-500'
                      }`}
                    >
                      {demoStatusStr || 'connected'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      {isSocketConnected ? <Wifi size={13} className="text-blue-500" /> : <WifiOff size={13} className="text-red-500" />}
                      Socket.IO Bus
                    </span>
                    <span className={`font-semibold ${isSocketConnected ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isSocketConnected ? 'Active' : 'Reconnecting'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between">
                  <span>Central API: :3001</span>
                  <span>ThreatX Core v1.0</span>
                </div>
              </div>
            )}
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-sm">
              <Clock size={12} className="text-gray-400" />
              <span className="font-mono text-[11px]">{lastUpdated}</span>
            </div>
          )}

          {/* Global Search Input */}
          <div
            onClick={() => setShowSearchModal(true)}
            className="relative cursor-pointer group"
          >
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
            <input
              type="text"
              readOnly
              placeholder="Search threats, IP, alerts..."
              className="pl-8.5 pr-10 py-1.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 placeholder:text-gray-400 group-hover:border-blue-300 cursor-pointer transition-all w-44 md:w-52 shadow-sm"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-mono text-gray-400">
              ⌘K
            </kbd>
          </div>

          {/* Alerts Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertDrawer(true)}
              className="relative p-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 transition-all text-gray-600 hover:text-gray-900 shadow-sm cursor-pointer"
              title="Open Alert Center"
              aria-label="Alerts"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-gray-900 shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 transition-all text-left shadow-sm cursor-pointer"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-gray-900 shadow-sm ${
                  userRole === 'admin'
                    ? 'bg-gradient-to-tr from-red-500 to-rose-400'
                    : userRole === 'analyst'
                    ? 'bg-gradient-to-tr from-blue-500 to-cyan-400'
                    : 'bg-gray-500'
                }`}
              >
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-gray-800 leading-tight">
                  {user?.name || 'SOC Commander'}
                </p>
                <p className="text-[10px] text-blue-600 uppercase font-mono font-bold">
                  {userRole}
                </p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200 bg-white shadow-lg p-1.5 z-50 animate-fade-in space-y-1 text-xs">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="font-semibold text-gray-900">{user?.name || 'SOC Commander'}</p>
                  <p className="text-[11px] text-gray-500 font-mono truncate">{user?.email || 'admin@threatx.io'}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">Role:</span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {userRole}
                    </span>
                  </div>
                </div>

                <a
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <User size={14} className="text-gray-400" />
                  <span>Account Settings</span>
                </a>

                {userRole === 'admin' && (
                  <a
                    href="/users"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <ShieldCheck size={14} className="text-blue-500" />
                    <span>User Management</span>
                  </a>
                )}

                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-left font-semibold cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>


      {/* Real-time Alert Center Drawer */}
      <AlertCenterDrawer
        isOpen={showAlertDrawer}
        onClose={() => setShowAlertDrawer(false)}
        alerts={alerts}
        onAlertUpdated={handleAlertUpdated}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectThreat={onSelectThreat}
        onSelectServer={onSelectServer}
      />

      {/* Demo Scenario Controller Modal */}
      <DemoScenarioModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />
    </>
  );
}
