import React from 'react';
import { Download, Plus } from 'lucide-react';
import { Card, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/common/Table';

export default function ReportsPage() {
  const reports = [
    { id: 'REP-1024', title: 'Weekly Security Summary', type: 'SCHEDULED', generated: '2 hours ago', status: 'READY' },
    { id: 'REP-1025', title: 'Compliance Audit - Q3', type: 'MANUAL', generated: '1 day ago', status: 'READY' },
    { id: 'REP-1026', title: 'Incident Post-Mortem (TRT-9021)', type: 'INCIDENT', generated: '3 days ago', status: 'READY' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark tracking-tight">Reports</h1>
          <p className="text-sm text-secondary-text mt-1">Generate and download security posture reports.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="primary" icon={Plus}>Generate New</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Report ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-primary-dark">{r.id}</TableCell>
                  <TableCell>{r.title}</TableCell>
                  <TableCell>
                    <Badge>{r.type}</Badge>
                  </TableCell>
                  <TableCell className="text-secondary-text">{r.generated}</TableCell>
                  <TableCell>
                    <Badge variant="success">{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" icon={Download}>Download PDF</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
