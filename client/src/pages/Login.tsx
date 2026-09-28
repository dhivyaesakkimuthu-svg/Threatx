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
  const from = (location.state as any)?.from?.pathname || '/';

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
    <div className="min-h-screen bg-[#F6F8FB] text-[#172033] flex flex-col justify-between relative selection:bg-[#2563EB] selection:text-white">
      {/* Header bar */}
      <header className="px-6 py-4 border-b border-[#E4E7EC] bg-white/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
            <Shield size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#172033]">
                THREATX
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                SOC v2.4
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#667085]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="font-medium text-[11px]">GATEWAY ONLINE</span>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="rounded-2xl border border-[#E4E7EC] bg-white shadow-xl p-6 sm:p-8 relative">
            {/* Title & Badge */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] mb-3 text-[#2563EB]">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-[#172033] tracking-tight">
                SOC Analyst Authentication
              </h2>
              <p className="text-xs text-[#667085] mt-1">
                Enter your credentials to access the ThreatX operations console.
              </p>
            </div>

            {/* Session Expired Alert */}
            {isExpired && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FEF3C7] text-[#D97706] text-xs flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0 text-[#F59E0B]" />
                <span>Your session has expired. Please authenticate again to continue.</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] text-xs flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0 text-[#EF4444]" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5 uppercase tracking-wider">
                  Operational Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@threatx.io"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5 uppercase tracking-wider">
                  Cryptographic Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#172033] transition-colors"
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
                className="w-full mt-2"
                icon={!loading ? <ArrowRight size={15} /> : undefined}
              >
                Authenticate Console
              </Button>
            </form>

            {/* Quick Demo Credentials Panel */}
            <div className="mt-6 pt-5 border-t border-[#E4E7EC]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
                  Quick Demo Credentials
                </span>
                <span className="text-[11px] text-[#2563EB] font-medium">Click to fill</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@threatx.io', 'Admin@ThreatX2026!')}
                  className="p-2.5 rounded-lg bg-[#F8FAFC] hover:bg-[#FEF2F2] border border-[#E4E7EC] hover:border-[#FEE2E2] transition-all text-left group cursor-pointer"
                >
                  <div className="text-xs font-bold text-[#DC2626]">Admin</div>
                  <div className="text-[10px] text-[#667085] truncate">Full Control</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('analyst@threatx.io', 'Analyst@ThreatX2026!')}
                  className="p-2.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E4E7EC] hover:border-[#DBEAFE] transition-all text-left group cursor-pointer"
                >
                  <div className="text-xs font-bold text-[#2563EB]">Analyst</div>
                  <div className="text-[10px] text-[#667085] truncate">Triage & Ops</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('viewer@threatx.io', 'Viewer@ThreatX2026!')}
                  className="p-2.5 rounded-lg bg-[#F8FAFC] hover:bg-[#ECFDF5] border border-[#E4E7EC] hover:border-[#A7F3D0] transition-all text-left group cursor-pointer"
                >
                  <div className="text-xs font-bold text-[#059669]">Viewer</div>
                  <div className="text-[10px] text-[#667085] truncate">Read-Only</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer System Status Bar */}
      <footer className="px-6 py-3 border-t border-[#E4E7EC] bg-white/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#667085]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                (typeof health?.database === 'object'
                  ? (health?.database as any)?.status === 'connected'
                  : health?.database === 'connected')
                  ? 'bg-[#10B981]'
                  : 'bg-[#EF4444]'
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
                  ? 'bg-[#10B981]'
                  : (typeof health?.demoServer === 'object'
                      ? (health?.demoServer as any)?.status === 'degraded'
                      : health?.demoServer === 'degraded')
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#EF4444]'
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
