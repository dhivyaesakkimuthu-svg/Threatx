import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Terminal, Shield, Key, ArrowRight, ArrowLeft } from 'lucide-react';
import Header from '../components/layout/Header';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddServer() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', hostname: '', os: 'Ubuntu 22.04', ipAddress: '' });
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const server = await api.createServer(form);
      setApiKey(server.apiKey || null);
      setStep(2);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create server');
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isWindows = form.os.toLowerCase().includes('windows');
  const isPythonAgent = form.os.toLowerCase().includes('python') || form.os.toLowerCase().includes('demo');
  
  const installCommand = apiKey
    ? isPythonAgent
      ? `python demo-server/theartx_agent.py --api-key ${apiKey} --theartx-url http://localhost:3001`
      : isWindows
      ? `iwr -useb https://agent.threatx.io/install.ps1 | iex; [ThreatX.Agent]::Install("${apiKey}")`
      : `curl -fsSL https://agent.threatx.io/install.sh | sudo bash -s -- --api-key ${apiKey}`
    : '';

  const copyCommand = () => {
    navigator.clipboard.writeText(installCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Header title="Enlist Server Node" subtitle="Securely connect a server with the monitoring agent" />

      {/* Progress Wizard Timeline */}
      <div className="flex items-center gap-4 max-w-xl mx-auto mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= s ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-[#667085]'
            }`}>
              {s}
            </div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-[#667085]">
              {s === 1 ? 'Details' : s === 2 ? 'Credentials' : 'Installation'}
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="max-w-xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 shadow-xs">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#172033] mb-4">Node Metadata Details</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">Server Name</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Production Web Server"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] text-xs text-[#172033] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">Hostname / FQDN</label>
                    <input
                      required
                      value={form.hostname}
                      onChange={(e) => setForm({ ...form, hostname: e.target.value })}
                      placeholder="prod-web-01.company.com"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] text-xs text-[#172033] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">Operating System</label>
                      <select
                        value={form.os}
                        onChange={(e) => setForm({ ...form, os: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] text-xs text-[#172033] focus:outline-none focus:border-blue-500"
                      >
                        <option value="Demo Target Node (Python)">Demo Target Node (Python Agent)</option>
                        <option value="Ubuntu 22.04">Ubuntu 22.04</option>
                        <option value="Ubuntu 20.04">Ubuntu 20.04</option>
                        <option value="RHEL 9">RHEL 9</option>
                        <option value="Windows Server 2022">Windows Server 2022</option>
                        <option value="Debian 12">Debian 12</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-1.5">IP Address</label>
                      <input
                        value={form.ipAddress}
                        onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                        placeholder="203.0.113.10"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] text-xs text-[#172033] focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-600 text-xs font-semibold uppercase tracking-wider text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-xs"
                  >
                    {loading ? 'Registering node...' : 'Generate API Credentials'}
                    <ArrowRight size={14} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {step === 2 && apiKey && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <Check size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#172033]">Credentials Generated</h3>
                    <p className="text-xs text-[#667085]">Node API key generated successfully. Copy it now.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC]">
                  <Key size={16} className="text-blue-600 shrink-0" />
                  <code className="text-xs font-mono text-[#172033] flex-1 break-all">{apiKey}</code>
                  <button onClick={copyKey} className="p-1.5 text-[#667085] hover:text-[#172033] transition-colors cursor-pointer">
                    {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>

                <button
                  onClick={() => setStep(3)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-600 text-xs font-semibold uppercase tracking-wider text-white hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Proceed to installation
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-blue-600" />
                  <h3 className="font-bold text-sm text-[#172033] uppercase tracking-wider">Install agent binary</h3>
                </div>
                <p className="text-xs text-[#667085] leading-relaxed">
                  Run the following payload command inside your server terminal (requires sudo privileges):
                </p>
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap select-all leading-normal">
                    {installCommand}
                  </pre>
                  <button
                    onClick={copyCommand}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedCmd ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Success checklist */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 shadow-2xs">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={18} className="text-emerald-600" />
                  <h3 className="font-bold text-sm text-emerald-800 uppercase tracking-wider">Waiting for Telemetry...</h3>
                </div>
                <ul className="text-xs text-[#667085] space-y-2">
                  <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">✓</span> API keys established</li>
                  <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">•</span> Agent checks in automatically upon service install</li>
                  <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">•</span> Encrypted TLS 1.3 telemetry streaming automatically</li>
                </ul>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-100 border border-[#E4E7EC] text-xs font-semibold text-[#172033] hover:bg-slate-200 transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => navigate('/servers')}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold uppercase tracking-wider text-white transition-all shadow-xs"
                >
                  Complete enlistment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

