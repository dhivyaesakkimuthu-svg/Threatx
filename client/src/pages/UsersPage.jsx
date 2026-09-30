import React from 'react';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/common/Table';

export default function UsersPage() {
  const users = [
    { name: 'Admin User', email: 'admin@threatx.com', role: 'ADMIN', status: 'ACTIVE', lastLogin: '2 mins ago' },
    { name: 'Bob Analyst', email: 'bob@threatx.com', role: 'ANALYST', status: 'ACTIVE', lastLogin: '1 hour ago' },
    { name: 'Alice Viewer', email: 'alice@threatx.com', role: 'VIEWER', status: 'OFFLINE', lastLogin: '3 days ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark tracking-tight">User Management</h1>
          <p className="text-sm text-secondary-text mt-1">Manage platform access and roles.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="primary" icon={UserPlus}>Add User</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-primary-dark">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'ADMIN' ? 'primary' : 'default'}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === 'ACTIVE' ? 'success' : 'default'}>{u.status}</Badge>
                  </TableCell>
                  <TableCell className="text-secondary-text">{u.lastLogin}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" icon={Pencil} className="w-8 h-8 p-0 mr-1" aria-label="Edit" />
                    <Button variant="ghost" size="sm" icon={Trash2} className="w-8 h-8 p-0 text-status-danger" aria-label="Delete" />
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
