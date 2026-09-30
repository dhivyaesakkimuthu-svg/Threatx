import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle, Shield, ShieldAlert, BrainCircuit, Activity, Server, UsersRound, SearchCheck } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* ADVANCED HERO SECTION */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-primary-dark">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-primary-darker border border-brand-blue/30 px-3 py-1 rounded-full mb-8">
            <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></div>
            <span className="text-xs font-semibold text-brand-cyan tracking-widest uppercase">Security System Online</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Intelligent Security Operations for the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-cyan">Modern Enterprise.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Monitor infrastructure, detect suspicious activity, analyze security risk, and manage incidents through one intelligent security operations platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/login">
              <Button size="lg" icon={ArrowRight} iconPosition="right" className="w-full sm:w-auto bg-brand-blue hover:bg-blue-600 border-none text-white">
                Enter SOC Console
              </Button>
            </Link>
            <a href="#platform">
              <Button variant="outline" size="lg" icon={PlayCircle} iconPosition="left" className="w-full sm:w-auto border-gray-700 text-white hover:bg-gray-800">
                Explore Platform
              </Button>
            </a>
          </div>
        </div>

        {/* ADVANCED HERO VISUAL */}
        <div className="max-w-5xl mx-auto mt-20 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="rounded-xl border border-brand-blue/20 shadow-2xl shadow-brand-blue/10 bg-secondary-dark overflow-hidden flex flex-col md:flex-row backdrop-blur-xl">
            {/* Sidebar Mock */}
            <div className="w-full md:w-64 bg-primary-darker text-gray-300 p-6 hidden md:block border-r border-brand-blue/10">
              <div className="flex items-center space-x-2 mb-8">
                <Shield className="h-6 w-6 text-brand-cyan" />
                <span className="font-bold text-lg text-white tracking-wider">THREATX</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm bg-brand-blue/10 text-brand-cyan p-2 rounded-lg border border-brand-blue/20">
                  <Activity className="h-4 w-4" />
                  <span>Dashboard</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-500 hover:text-gray-300 p-2 transition-colors">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Threats</span>
                </div>
              </div>
            </div>
            {/* Main Content Mock */}
            <div className="flex-1 p-6 md:p-8 bg-secondary-dark flex flex-col space-y-6">
              <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                <h2 className="text-lg font-semibold text-white tracking-wide">SOC Command Center</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-900/30 text-status-danger border border-red-800/50">
                  HIGH RISK DETECTED
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-primary-dark rounded-lg p-4 border border-gray-800">
                  <p className="text-xs text-gray-400 mb-1">Security Score</p>
                  <div className="text-3xl font-bold text-status-warning">82</div>
                </div>
                <div className="bg-primary-dark rounded-lg p-4 border border-gray-800">
                  <p className="text-xs text-gray-400 mb-1">Active Threats</p>
                  <div className="text-3xl font-bold text-status-danger">24</div>
                </div>
                <div className="bg-primary-dark rounded-lg p-4 border border-gray-800">
                  <p className="text-xs text-gray-400 mb-1">Servers</p>
                  <div className="text-3xl font-bold text-status-success">8 / 8 <span className="text-xs text-gray-500 font-normal">Online</span></div>
                </div>
                <div className="bg-primary-dark rounded-lg p-4 border border-gray-800">
                  <p className="text-xs text-gray-400 mb-1">Live Sessions</p>
                  <div className="text-3xl font-bold text-brand-cyan">16</div>
                </div>
              </div>
              
              <div className="flex-1 min-h-[160px] bg-primary-dark rounded-lg border border-gray-800 p-4 relative overflow-hidden">
                <p className="text-xs text-gray-400 mb-4 flex items-center"><Activity className="w-3 h-3 mr-2"/> Live Event Stream</p>
                <div className="space-y-3 opacity-70">
                  <div className="flex items-center space-x-3 text-sm"><span className="text-status-danger text-xs font-mono">12:31:04</span><span className="text-gray-300">Anomalous login attempt from 192.168.1.104</span></div>
                  <div className="flex items-center space-x-3 text-sm"><span className="text-status-warning text-xs font-mono">12:30:55</span><span className="text-gray-300">CPU Spike detected on prod-db-primary</span></div>
                  <div className="flex items-center space-x-3 text-sm"><span className="text-status-success text-xs font-mono">12:30:12</span><span className="text-gray-300">Routine baseline check passed</span></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-primary-dark to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div className="bg-primary-dark border-b border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50">
            <div className="flex items-center space-x-2 text-white"><Activity className="h-4 w-4"/><span className="text-sm tracking-wide">Real-Time Monitoring</span></div>
            <div className="flex items-center space-x-2 text-white"><ShieldAlert className="h-4 w-4"/><span className="text-sm tracking-wide">Threat Detection</span></div>
            <div className="flex items-center space-x-2 text-white"><BrainCircuit className="h-4 w-4"/><span className="text-sm tracking-wide">AI Risk Analysis</span></div>
            <div className="flex items-center space-x-2 text-white"><Server className="h-4 w-4"/><span className="text-sm tracking-wide">Infrastructure Visibility</span></div>
          </div>
        </div>
      </div>

      {/* PLATFORM FEATURES */}
      <section id="platform" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary-dark">Everything Security Teams Need in One Console</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Activity, title: "Real-Time Monitoring", desc: "Monitor your entire infrastructure continuously with zero blind spots." },
              { icon: ShieldAlert, title: "Threat Detection", desc: "Identify anomalous behavior and known attack patterns instantly." },
              { icon: BrainCircuit, title: "AI Intelligence", desc: "Leverage machine learning to prioritize alerts and predict threats." },
              { icon: SearchCheck, title: "Alert Management", desc: "Centralized alert triaging, investigation, and resolution workflows." },
              { icon: Server, title: "Server Monitoring", desc: "Deep visibility into CPU, memory, and network health across nodes." },
              { icon: UsersRound, title: "Session Monitoring", desc: "Track active user sessions and identify unauthorized access attempts." }
            ].map((feat, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                    <feat.icon className="h-6 w-6 text-brand-blue" />
                  </div>
                  <CardTitle>{feat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feat.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-dark mb-16">How ThreatX Works</h2>
          <div className="flex flex-col md:flex-row justify-between items-center relative space-y-8 md:space-y-0">
            {/* Desktop Connector Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
            
            {[
              "Telemetry", "Detection", "Risk Analysis", "Alert", "Action"
            ].map((step, i) => (
              <div key={i} className="bg-white px-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg border-4 border-white">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-primary-dark">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 bg-primary-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/20"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Bring Your Security Operations Into One View.</h2>
          <p className="text-xl text-gray-300 mb-10">
            Monitor infrastructure, investigate threats, analyze risk, and manage security operations from a unified console.
          </p>
          <Link to="/login">
            <Button size="lg" icon={ArrowRight} iconPosition="right" className="bg-brand-blue hover:bg-blue-600 border-none">
              Enter SOC Console
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
