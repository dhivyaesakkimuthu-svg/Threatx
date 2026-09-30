import React from 'react';
import { Filter, Search } from 'lucide-react';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/common/Table';

export default function AuditLogsPage() {
  const logs = [
    { time: '10:42 AM', user: 'admin', action: 'TERMINATE_SESSION', resource: 'SESS-844', ip: '192.168.1.10' },
    { time: '09:15 AM', user: 'system', action: 'ALERT_RESOLVED', resource: 'TRT-9021', ip: 'localhost' },
    { time: '08:30 AM', user: 'analyst_bob', action: 'LOGIN_SUCCESS', resource: 'AUTH', ip: '10.0.5.22' },
    { time: '08:29 AM', user: 'analyst_bob', action: 'LOGIN_FAILED', resource: 'AUTH', ip: '10.0.5.22' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark tracking-tight">Audit Logs</h1>
          <p className="text-sm text-secondary-text mt-1">Immutable record of system and user activity.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" icon={Filter}>Filter</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Source IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, i) => (
                <TableRow key={i}>
                  <TableCell className="text-secondary-text whitespace-nowrap">{log.time}</TableCell>
                  <TableCell className="font-medium text-primary-dark">{log.user}</TableCell>
                  <TableCell className="font-mono text-xs">{log.action}</TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell className="text-secondary-text">{log.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
