import React from 'react';
import { Search, Filter, RefreshCw, Eye, Pencil, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '../components/common/Card';
import { Badge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export default function ThreatsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark tracking-tight">Threat Management</h1>
          <p className="text-sm text-secondary-text mt-1">Review and manage active security threats.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" icon={RefreshCw}>Refresh</Button>
          <Button variant="primary" icon={Filter}>Filter</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-secondary-text border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Threat ID</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium">Source</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary-dark">TRT-9021</td>
                  <td className="px-6 py-4">Brute Force</td>
                  <td className="px-6 py-4"><Badge variant="danger">CRITICAL</Badge></td>
                  <td className="px-6 py-4 font-mono text-xs">192.168.1.104</td>
                  <td className="px-6 py-4"><StatusBadge status="INVESTIGATING" /></td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" icon={Eye} className="w-8 h-8 p-0 mr-1" aria-label="View" />
                    <Button variant="ghost" size="sm" icon={MoreHorizontal} className="w-8 h-8 p-0" aria-label="More" />
                  </td>
                </tr>
                {/* Empty State placeholder if needed */}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
