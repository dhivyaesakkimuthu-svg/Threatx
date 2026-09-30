import React from 'react';
import { Search, Filter, RefreshCw, Server, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { Badge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export default function ServersPage() {
  const servers = [
    { id: 'SRV-001', name: 'prod-db-primary', ip: '10.0.1.4', status: 'HEALTHY', cpu: 45, mem: 62, sessions: 124 },
    { id: 'SRV-002', name: 'prod-api-01', ip: '10.0.2.11', status: 'WARNING', cpu: 88, mem: 75, sessions: 312 },
    { id: 'SRV-003', name: 'prod-api-02', ip: '10.0.2.12', status: 'HEALTHY', cpu: 32, mem: 41, sessions: 189 },
    { id: 'SRV-004', name: 'prod-cache', ip: '10.0.3.5', status: 'CRITICAL', cpu: 99, mem: 94, sessions: 45 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark tracking-tight">Server Infrastructure</h1>
          <p className="text-sm text-secondary-text mt-1">Monitor health and performance of connected nodes.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" icon={RefreshCw}>Refresh</Button>
          <Button variant="primary" icon={Filter}>Filter</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg mr-4">
              <Server className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-text">Total Servers</p>
              <h3 className="text-2xl font-bold text-primary-dark">42</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="p-3 bg-red-50 rounded-lg mr-4">
              <Activity className="h-6 w-6 text-status-danger" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-text">Critical Load</p>
              <h3 className="text-2xl font-bold text-primary-dark">3</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-secondary-text border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Server</th>
                  <th className="px-6 py-4 font-medium">IP Address</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">CPU Load</th>
                  <th className="px-6 py-4 font-medium">Memory</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {servers.map((server) => (
                  <tr key={server.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-primary-dark">{server.name}</div>
                      <div className="text-xs text-secondary-text">{server.id}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{server.ip}</td>
                    <td className="px-6 py-4"><StatusBadge status={server.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[100px]">
                          <div className={`h-1.5 rounded-full ${server.cpu > 80 ? 'bg-status-danger' : 'bg-brand-blue'}`} style={{ width: `${server.cpu}%` }}></div>
                        </div>
                        <span className="text-xs font-medium">{server.cpu}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{server.mem}%</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
