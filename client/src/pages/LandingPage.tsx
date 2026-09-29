import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  BrainCircuit,
  LogIn,
  Radio,
  Sparkles,
  Lock,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { HeroProductPreview } from '../components/landing/HeroProductPreview';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#172033] font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E4E7EC] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-[#2563EB] text-gray-900 p-2.5 rounded-xl shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[#172033]">THREATX</span>
              <span className="block text-[11px] text-[#667085] font-medium">Security Operations Center</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#667085]">
            <a href="#platform" className="hover:text-[#2563EB] transition-colors">
              Platform
            </a>
            <a href="#capabilities" className="hover:text-[#2563EB] transition-colors">
              Capabilities
            </a>
            <a href="#intelligence" className="hover:text-[#2563EB] transition-colors">
              Intelligence
            </a>
            <a href="#monitoring" className="hover:text-[#2563EB] transition-colors">
              Monitoring
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-[#172033] hover:bg-[#F6F8FB] rounded-lg transition-colors border border-[#E4E7EC]"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-gray-900 bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm transition-all"
            >
              <span>Enter SOC Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="platform" className="py-16 md:py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-[#2563EB]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
              <span>ThreatX Unified SOC v2.4 Active</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#172033] leading-tight tracking-tight">
              Real-Time Security Operations, <br />
              <span className="text-[#2563EB]">Built for Modern Infrastructure.</span>
            </h1>
            <p className="text-base text-[#667085] leading-relaxed">
              ThreatX unifies server telemetry, cyber threat detection, AI-assisted risk analysis, IOC reputation feeds, and automated incident triage into one intelligent platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 text-sm font-semibold text-gray-900 bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-md transition-all"
              >
                <span>Enter SOC Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#capabilities"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 text-sm font-semibold text-[#172033] bg-white border border-[#E4E7EC] hover:bg-gray-50 rounded-lg transition-all shadow-xs"
              >
                <span>Explore Capabilities</span>
              </a>
            </div>

            {/* Quick Metrics under CTA */}
            <div className="pt-6 border-t border-[#E4E7EC] grid grid-cols-3 gap-4 text-xs text-[#667085]">
              <div>
                <strong className="block text-base font-bold text-[#172033]">0ms</strong>
                <span>WebSocket latency</span>
              </div>
              <div>
                <strong className="block text-base font-bold text-[#172033]">90+</strong>
                <span>AV Scanners (VirusTotal)</span>
              </div>
              <div>
                <strong className="block text-base font-bold text-[#172033]">Gemini AI</strong>
                <span>Triage &amp; MITRE Copilot</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <HeroProductPreview />
          </div>
        </div>
      </section>

      {/* Trust & Architecture Pipeline */}
      <section id="pipeline" className="py-16 bg-white border-y border-[#E4E7EC] px-6">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div>
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider block mb-1">
              Real-Time Security Architecture
            </span>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#172033]">
              Continuous Multi-Tier Processing Pipeline
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
            {[
              { title: 'Telemetry', desc: 'Hardware & SSH Signals' },
              { title: 'Detection', desc: 'Rule & Anomaly Matching' },
              { title: 'Risk Analysis', desc: '0–100 Explainable Score' },
              { title: 'Intelligence', desc: 'AbuseIPDB & VirusTotal' },
              { title: 'AI Copilot', desc: 'MITRE ATT&CK & Playbooks' },
              { title: 'Analyst Action', desc: 'Containment & Resolution' },
            ].map((step, idx) => (
              <React.Fragment key={step.title}>
                <div className="p-4 bg-[#F6F8FB] border border-[#E4E7EC] rounded-xl text-center shadow-xs transition-all hover:border-blue-300">
                  <span className="text-[11px] font-bold text-[#2563EB] block uppercase tracking-wider">
                    Step {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-[#172033] mt-1 block">{step.title}</span>
                  <span className="text-[11px] text-[#667085] mt-0.5 block">{step.desc}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider block">
            Comprehensive Capabilities
          </span>
          <h2 className="text-3xl font-extrabold text-[#172033] tracking-tight">
            Engineered for Modern Security Teams
          </h2>
          <p className="text-sm text-[#667085] leading-relaxed">
            Eliminate siloed tools with a unified suite that combines detection, live external IOC feeds, artificial intelligence, and role-based incident operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Telemetry & Ingestion */}
          <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">Live Server Telemetry Ingestion</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Streams sub-second CPU, memory, active SSH session counts, and network health metrics directly from target Linux nodes.
            </p>
          </div>

          {/* Card 2: AI Anomaly & Threat Engine */}
          <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">Multi-Factor Anomaly Scoring</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Calculates deterministic 0–100 risk levels with explainable rationales for brute-force attacks, credential dumping, and resource surges.
            </p>
          </div>

          {/* Card 3: AbuseIPDB & VirusTotal Scanner */}
          <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">Live IOC Reputation Scanner</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Instantly checks IP addresses, domains, and file hashes against AbuseIPDB confidence scores and 90+ VirusTotal antivirus engines.
            </p>
          </div>

          {/* Card 4: Gemini AI SOC Copilot */}
          <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">Google Gemini SOC Copilot</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Automates MITRE ATT&amp;CK mapping, generates 3-phase containment playbooks, forensic CLI commands, and audit-ready CISO reports.
            </p>
          </div>

          {/* Card 5: Enterprise RBAC & Auditing */}
          <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">Enterprise RBAC &amp; Audit Logs</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Enforces strict Admin, Analyst, and Viewer permissions with immutable, tamper-evident MongoDB security audit trails.
            </p>
          </div>

          {/* Card 6: Attack Simulation Engine */}
          <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">Built-in Attack Simulator</h3>
            <p className="text-xs text-[#667085] leading-relaxed">
              Includes 5 controlled cyber attack scenarios to validate detection playbooks and train analysts safely in a sandbox.
            </p>
          </div>
        </div>
      </section>

      {/* Intelligence & Integrations Showcase */}
      <section id="intelligence" className="py-20 bg-white border-y border-[#E4E7EC] px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider block">
              Integrated Intelligence Ecosystem
            </span>
            <h2 className="text-3xl font-extrabold text-[#172033] tracking-tight">
              Powered by Industry-Leading Feeds &amp; AI
            </h2>
            <p className="text-sm text-[#667085]">
              ThreatX integrates directly with global threat intelligence providers and frontier generative AI models.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#F6F8FB] border border-[#E4E7EC] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded border border-orange-200">
                  AbuseIPDB v2
                </span>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Integrated
                </span>
              </div>
              <h4 className="text-base font-bold text-[#172033]">Community Threat Reputation</h4>
              <p className="text-xs text-[#667085] leading-relaxed">
                Queries IP reputation, abuse confidence scoring (0–100%), ISP network details, and historical attack categories.
              </p>
            </div>

            <div className="p-6 bg-[#F6F8FB] border border-[#E4E7EC] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  VirusTotal v3
                </span>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Integrated
                </span>
              </div>
              <h4 className="text-base font-bold text-[#172033]">Multi-Engine Antivirus Scanner</h4>
              <p className="text-xs text-[#667085] leading-relaxed">
                Consolidates detection verdicts across 90+ security engines for IP addresses, hostnames, and SHA256/MD5 hashes.
              </p>
            </div>

            <div className="p-6 bg-[#F6F8FB] border border-[#E4E7EC] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
                  Google Gemini AI
                </span>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Integrated
                </span>
              </div>
              <h4 className="text-base font-bold text-[#172033]">Generative Incident Sentinel</h4>
              <p className="text-xs text-[#667085] leading-relaxed">
                Provides AI Copilot triage, interactive adversary analysis, MITRE ATT&amp;CK matrix mapping, and CISO executive report generation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Monitoring & Operational CTA Section */}
      <section id="monitoring" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-8 md:p-14 text-gray-900 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-gray-900 border border-white/20 uppercase tracking-wider inline-block">
              Operational SOC Access
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
              Ready to Monitor Your Infrastructure in Real-Time?
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Launch the ThreatX SOC console to access the live dashboard, threat monitor, telemetry streams, and AI security investigator.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white hover:bg-slate-50 text-[#2563EB] font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Enter SOC Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E4E7EC] px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#667085]">
          <div className="flex items-center space-x-2">
            <div className="bg-[#2563EB] text-gray-900 p-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-[#172033]">THREATX SOC</span>
            <span>— Enterprise Cyber Threat Intelligence Platform</span>
          </div>

          <div className="flex items-center space-x-6 font-medium">
            <a href="#platform" className="hover:text-[#2563EB]">Platform</a>
            <a href="#capabilities" className="hover:text-[#2563EB]">Capabilities</a>
            <a href="#intelligence" className="hover:text-[#2563EB]">Intelligence</a>
            <button onClick={() => navigate('/login')} className="hover:text-[#2563EB]">Console Login</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
