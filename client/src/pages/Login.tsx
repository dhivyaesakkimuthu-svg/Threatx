import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { api, type HealthData } from '../services/api';
import Button from '../components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isExpired = new URLSearchParams(location.search).get('expired') === 'true';
  const rawFrom = (location.state as any)?.from?.pathname;
  const from = rawFrom && rawFrom !== '/' ? rawFrom : '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch(() => null);
    const timer = setInterval(() => {
      api.getHealth().then(setHealth).catch(() => null);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setError(res.error || 'Invalid credentials or account disabled.');
    }
  };

  const handleQuickFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-gray-900 flex flex-col justify-between relative selection:bg-blue-600 selection:text-gray-900">
      {/* Header bar */}
      <header className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-gray-900 shadow-lg">
            <Shield size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wider text-gray-900 font-mono">
                THREAT<span className="text-blue-600">X</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                SOC COMMAND
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-[11px] font-mono text-emerald-600">GATEWAY SECURE</span>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-6 sm:p-8 relative">
            {/* Title & Badge */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 mb-3 text-blue-600">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                SOC Commander Authentication
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Enter your cryptographic credentials to access the ThreatX operations console.
              </p>
            </div>

            {/* Session Expired Alert */}
            {isExpired && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0 text-amber-500" />
                <span>Your session has expired. Please authenticate again to continue.</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider font-mono">
                  Operational Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@threatx.io"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider font-mono">
                  Cryptographic Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-gray-900 font-bold"
                icon={!loading ? <ArrowRight size={15} /> : undefined}
              >
                Authenticate Console
              </Button>
            </form>

            {/* Quick Demo Credentials Panel */}
            <div className="mt-6 pt-5 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Quick Demo Credentials
                </span>
                <span className="text-[11px] text-blue-600 font-medium">Click to fill</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@threatx.io', 'Admin@ThreatX2026!')}
                  className="p-2.5 rounded-xl bg-gray-50 hover:bg-rose-50 border border-gray-200 hover:border-rose-300 transition-all text-left group cursor-pointer"
                >
                  <div className="text-xs font-bold text-rose-600">Admin</div>
                  <div className="text-[10px] text-gray-400 truncate">Full Control</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('analyst@threatx.io', 'Analyst@ThreatX2026!')}
                  className="p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all text-left group cursor-pointer"
                >
                  <div className="text-xs font-bold text-blue-600">Analyst</div>
                  <div className="text-[10px] text-gray-400 truncate">Triage & Ops</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('viewer@threatx.io', 'Viewer@ThreatX2026!')}
                  className="p-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 transition-all text-left group cursor-pointer"
                >
                  <div className="text-xs font-bold text-emerald-600">Viewer</div>
                  <div className="text-[10px] text-gray-400 truncate">Read-Only</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer System Status Bar */}
      <footer className="px-6 py-3 border-t border-gray-200 bg-white flex flex-wrap items-center justify-between gap-4 text-[11px] text-gray-500 font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                (typeof health?.database === 'object'
                  ? (health?.database as any)?.status === 'connected'
                  : health?.database === 'connected')
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              MongoDB:{' '}
              {typeof health?.database === 'object'
                ? (health?.database as any)?.status || 'connected'
                : health?.database || 'connected'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                (typeof health?.demoServer === 'object'
                  ? (health?.demoServer as any)?.status === 'connected'
                  : health?.demoServer === 'connected')
                  ? 'bg-emerald-500'
                  : (typeof health?.demoServer === 'object'
                      ? (health?.demoServer as any)?.status === 'degraded'
                      : health?.demoServer === 'degraded')
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              Demo Server (:5001):{' '}
              {typeof health?.demoServer === 'object'
                ? (health?.demoServer as any)?.status || 'connected'
                : health?.demoServer || 'connected'}
            </span>
          </div>
        </div>
        <div>
          <span>ThreatX Cyber Operations • ISO/NIST SOC Baseline</span>
        </div>
      </footer>
    </div>
  );
}
