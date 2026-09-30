import React from 'react';
import { ShieldAlert, Activity, Server, UsersRound, ArrowUpRight, ArrowDownRight, BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark tracking-tight">Security Overview</h1>
          <p className="text-sm text-secondary-text mt-1">Real-time security operations and infrastructure monitoring.</p>
        </div>
        <Badge variant="primary" className="px-3 py-1">
          <BrainCircuit className="w-3 h-3 mr-2 inline" />
          AI Analysis Active
        </Badge>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-secondary-text mb-1">Active Threats</p>
                <h3 className="text-3xl font-bold text-primary-dark">14</h3>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <ShieldAlert className="h-5 w-5 text-status-danger" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-status-danger flex items-center font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                12%
              </span>
              <span className="text-secondary-text ml-2">vs last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-secondary-text mb-1">Critical Alerts</p>
                <h3 className="text-3xl font-bold text-primary-dark">3</h3>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Activity className="h-5 w-5 text-status-warning" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-status-success flex items-center font-medium">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                5%
              </span>
              <span className="text-secondary-text ml-2">vs last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-secondary-text mb-1">Online Servers</p>
                <h3 className="text-3xl font-bold text-primary-dark">42</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Server className="h-5 w-5 text-brand-blue" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-status-success flex items-center font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                2%
              </span>
              <span className="text-secondary-text ml-2">vs last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-secondary-text mb-1">Active Sessions</p>
                <h3 className="text-3xl font-bold text-primary-dark">1,284</h3>
              </div>
              <div className="p-2 bg-teal-50 rounded-lg">
                <UsersRound className="h-5 w-5 text-brand-teal" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-status-success flex items-center font-medium">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                8%
              </span>
              <span className="text-secondary-text ml-2">vs last hour</span>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Security Posture */}
        <Card className="lg:col-span-1" dark>
          <CardHeader>
            <CardTitle>Security Posture</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-800"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-status-warning"
                  strokeDasharray="65, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-white">65</span>
                <span className="text-xs text-gray-400 uppercase tracking-widest mt-1">Score</span>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Badge variant="warning" className="mb-2">ELEVATED RISK</Badge>
              <p className="text-sm text-gray-400">3 critical vulnerabilities detected in production servers.</p>
            </div>
          </CardContent>
        </Card>

        {/* Server Health / Placeholders for charts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Infrastructure Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-xl border border-dashed border-border flex items-center justify-center">
              <p className="text-secondary-text text-sm flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Telemetry Visualization Area
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
