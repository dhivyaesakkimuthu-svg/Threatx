import React from 'react';
import { Search, Filter, ShieldAlert, Ban } from 'lucide-react';
import { Card, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/common/Table';

export default function SessionsPage() {
  const sessions = [
    { id: 'SESS-842', server: 'prod-api-01', user: 'admin', ip: '192.168.1.10', status: 'ACTIVE', started: '10 mins ago' },
    { id: 'SESS-843', server: 'prod-db-primary', user: 'system', ip: '10.0.1.5', status: 'ACTIVE', started: '2 hours ago' },
    { id: 'SESS-844', server: 'prod-cache', user: 'unknown', ip: '45.22.19.102', status: 'SUSPICIOUS', started: '1 min ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark tracking-tight">Active Sessions</h1>
          <p className="text-sm text-secondary-text mt-1">Monitor user and system sessions across the network.</p>
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
                <TableHead>Session ID</TableHead>
                <TableHead>Target Server</TableHead>
                <TableHead>User / Identity</TableHead>
                <TableHead>Source IP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-primary-dark">{s.id}</TableCell>
                  <TableCell>{s.server}</TableCell>
                  <TableCell className="font-medium">{s.user}</TableCell>
                  <TableCell className="font-mono text-xs">{s.ip}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'ACTIVE' ? 'success' : 'warning'}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-secondary-text">{s.started}</TableCell>
                  <TableCell className="text-right">
                    {s.status === 'SUSPICIOUS' ? (
                      <Button variant="danger" size="sm" icon={Ban}>Terminate</Button>
                    ) : (
                      <Button variant="ghost" size="sm">Details</Button>
                    )}
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
