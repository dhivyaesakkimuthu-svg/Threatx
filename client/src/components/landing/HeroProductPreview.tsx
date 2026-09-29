import { ShieldAlert, Server, Activity, ArrowUpRight, Radio, Sparkles } from 'lucide-react';

export function HeroProductPreview() {
  return (
    <div className="bg-white border border-[#E4E7EC] rounded-2xl shadow-xl p-6 space-y-5 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-4">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse"></span>
          <span className="text-xs font-bold text-[#172033] uppercase tracking-wide flex items-center gap-1.5">
            Live Threat Telemetry &amp; Intelligence
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#667085] bg-[#F6F8FB] px-2.5 py-1 rounded-md border border-[#E4E7EC] font-mono">
            Socket.IO Active
          </span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 bg-[#F6F8FB] rounded-xl border border-[#E4E7EC]">
          <div className="flex items-center justify-between text-[#667085] text-xs">
            <span className="font-medium">Security Posture</span>
            <Activity className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#172033] mt-2">94/100</div>
          <span className="text-[11px] text-[#16A34A] font-medium mt-1 block">Optimal Health</span>
        </div>

        <div className="p-3.5 sm:p-4 bg-[#F6F8FB] rounded-xl border border-[#E4E7EC]">
          <div className="flex items-center justify-between text-[#667085] text-xs">
            <span className="font-medium">Active Threats</span>
            <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#172033] mt-2">3</div>
          <span className="text-[11px] text-[#DC2626] font-medium mt-1 block">2 High Severity</span>
        </div>

        <div className="p-3.5 sm:p-4 bg-[#F6F8FB] rounded-xl border border-[#E4E7EC]">
          <div className="flex items-center justify-between text-[#667085] text-xs">
            <span className="font-medium">Monitored Nodes</span>
            <Server className="w-4 h-4 text-[#0EA5A4]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#172033] mt-2">12</div>
          <span className="text-[11px] text-[#16A34A] font-medium mt-1 block">100% Online</span>
        </div>
      </div>

      {/* Intelligence Correlation Box */}
      <div className="p-4 bg-[#F6F8FB] border border-[#E4E7EC] rounded-xl space-y-2.5">
        <div className="flex justify-between items-center text-xs font-semibold text-[#172033]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            AI &amp; External IOC Correlation
          </span>
          <span className="text-[#2563EB] flex items-center text-[11px] font-bold">
            Live Stream <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </span>
        </div>

        <div className="text-xs text-[#667085] bg-white p-3 rounded-lg border border-[#E4E7EC] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#DC2626] text-[11px]">[CRITICAL ANOMALY]</span>
            <span className="text-[10px] font-mono text-gray-400">118.25.6.39</span>
          </div>
          <p className="text-slate-800 text-[11px]">
            Unauthorized root escalation detected on <code className="text-[#2563EB] font-mono bg-blue-50 px-1 py-0.5 rounded">prod-api-01</code>.
            AbuseIPDB confidence: <strong>88%</strong> • Gemini Risk Assessment: <strong>High</strong>.
          </p>
        </div>
      </div>

      {/* Live Active Integrations Strip */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-[#667085]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-orange-500" /> AbuseIPDB
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> VirusTotal
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" /> Gemini AI
          </span>
        </div>
        <span className="text-emerald-700 font-semibold">Zero-Latency Bus</span>
      </div>
    </div>
  );
}

export default HeroProductPreview;
