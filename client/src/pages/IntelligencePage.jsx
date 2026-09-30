import React from 'react';
import { BrainCircuit, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export default function IntelligencePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark tracking-tight">AI Intelligence Engine</h1>
          <p className="text-sm text-secondary-text mt-1">Automated risk analysis and behavioral profiling.</p>
        </div>
        <Badge variant="primary" className="px-3 py-1 text-sm">
          <BrainCircuit className="w-4 h-4 mr-2 inline" />
          Engine Online
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-brand-blue/20 shadow-sm shadow-blue-900/5">
          <CardHeader>
            <CardTitle>Global Risk Score</CardTitle>
            <CardDescription>Aggregate AI assessment of current posture</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="text-6xl font-bold text-primary-dark my-6">74</div>
            <Badge variant="warning" className="mb-4">ELEVATED RISK</Badge>
            <p className="text-sm text-secondary-text text-center">Confidence Level: 92%</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent AI Findings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="p-4 rounded-xl border border-border bg-gray-50 flex flex-col sm:flex-row gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5 text-status-danger" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-primary-dark">Anomalous Lateral Movement Detected</h4>
                <p className="text-sm text-secondary-text mt-1">
                  Server `prod-cache` initiated unexpected connections to `prod-db-primary`. 
                  Pattern matches known ransomware staging behaviors.
                </p>
                <div className="mt-3 flex space-x-2">
                  <Badge variant="danger">CRITICAL</Badge>
                  <Badge variant="default">Confidence: High</Badge>
                </div>
              </div>
              <div className="flex-shrink-0 flex sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2">
                <Button size="sm" variant="outline" icon={FileText}>View Log</Button>
                <Button size="sm" variant="primary" icon={CheckCircle2}>Auto-Isolate</Button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-gray-50 flex flex-col sm:flex-row gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <BrainCircuit className="h-5 w-5 text-status-warning" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-primary-dark">Unusual Login Velocity</h4>
                <p className="text-sm text-secondary-text mt-1">
                  User `admin` authenticated from 3 geographically distant IPs within 15 minutes.
                </p>
                <div className="mt-3 flex space-x-2">
                  <Badge variant="warning">WARNING</Badge>
                  <Badge variant="default">Confidence: Medium</Badge>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button size="sm" variant="outline">Investigate</Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
