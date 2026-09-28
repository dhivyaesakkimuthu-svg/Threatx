import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  Shield,
  ShieldAlert,
  Eye,
  CheckCircle2,
  Search,
  RefreshCw,
  Lock,
  Mail,
  User,
  AlertCircle,
  X,
} from 'lucide-react';
import Topbar from '../components/Topbar';
import Button from '../components/ui/Button';
import { api, type UserProfile, type UserRole, type UserStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form state for creating user
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('analyst');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      const list = Array.isArray(res) ? res : res.data || [];
      setUsers(list);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) {
      setActionError('All fields are required.');
      return;
    }
    setActionError(null);
    setSubmitting(true);
    try {
      await api.createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setActionSuccess(`User ${newEmail} created successfully.`);
      setShowCreateModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('analyst');
      fetchUsers();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.updateUserRole(userId, newRole);
      setActionSuccess('User role updated successfully.');
      fetchUsers();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update role');
    }
  };

  const handleStatusToggle = async (user: UserProfile) => {
    setActionError(null);
    setActionSuccess(null);
    const newStatus: UserStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      await api.updateUserStatus(user.id, newStatus);
      setActionSuccess(`User ${user.email} ${newStatus === 'active' ? 'enabled' : 'disabled'}.`);
      fetchUsers();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to toggle status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const counts = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    analysts: users.filter((u) => u.role === 'analyst').length,
    viewers: users.filter((u) => u.role === 'viewer').length,
    active: users.filter((u) => u.status === 'active').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Topbar
        title="User & Access Management"
        subtitle="Role-Based Access Control (RBAC), Identity Governance & Account Status"
      />

      {/* Notifications */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-[#B91C1C] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[#EF4444] shrink-0" />
            <span className="font-medium">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-[#991B1B] hover:text-[#7F1D1D]" aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-[#065F46] hover:text-[#047857]" aria-label="Dismiss success">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-sm">
          <div className="flex items-center justify-between text-[#667085] text-xs font-semibold">
            <span>TOTAL USERS</span>
            <div className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
              <UsersIcon size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#172033] mt-2">{counts.total}</div>
          <div className="text-[11px] text-[#059669] font-medium mt-1">{counts.active} Active accounts</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-sm">
          <div className="flex items-center justify-between text-[#667085] text-xs font-semibold">
            <span>ADMINISTRATORS</span>
            <div className="p-1.5 rounded-lg bg-[#FEF2F2] text-[#DC2626]">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#DC2626] mt-2">{counts.admins}</div>
          <div className="text-[11px] text-[#667085] mt-1">Full privileged access</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-sm">
          <div className="flex items-center justify-between text-[#667085] text-xs font-semibold">
            <span>SOC ANALYSTS</span>
            <div className="p-1.5 rounded-lg bg-[#F0FDFA] text-[#0EA5A4]">
              <Shield size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0EA5A4] mt-2">{counts.analysts}</div>
          <div className="text-[11px] text-[#667085] mt-1">Triage & Investigation</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-sm">
          <div className="flex items-center justify-between text-[#667085] text-xs font-semibold">
            <span>VIEWERS</span>
            <div className="p-1.5 rounded-lg bg-[#ECFDF5] text-[#059669]">
              <Eye size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#059669] mt-2">{counts.viewers}</div>
          <div className="text-[11px] text-[#667085] mt-1">Read-only audit level</div>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, email, role..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="analyst">Analyst</option>
            <option value="viewer">Viewer</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={13} className={loading ? 'animate-spin text-[#2563EB]' : ''} />}
            onClick={fetchUsers}
            aria-label="Refresh Users"
          >
            Refresh
          </Button>
        </div>

        {/* Create User Button */}
        <Button
          variant="primary"
          size="sm"
          icon={<UserPlus size={14} />}
          onClick={() => setShowCreateModal(true)}
        >
          Provision User
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#E4E7EC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E4E7EC] bg-[#F8FAFC] text-[11px] font-semibold text-[#667085]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role (RBAC)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F4F9] text-[#172033]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#667085]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#2563EB]" />
                    Fetching user identities from MongoDB...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#667085]">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              u.role === 'admin'
                                ? 'bg-[#FEE2E2] text-[#DC2626]'
                                : u.role === 'analyst'
                                ? 'bg-[#E0F2FE] text-[#0284C7]'
                                : 'bg-[#DCFCE7] text-[#16A34A]'
                            }`}
                          >
                            {u.name ? u.name.substring(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <div className="font-semibold text-[#172033] flex items-center gap-2">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#667085] font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          disabled={isCurrent}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold border cursor-pointer ${
                            u.role === 'admin'
                              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]'
                              : u.role === 'analyst'
                              ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]'
                              : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          <option value="admin">ADMIN</option>
                          <option value="analyst">ANALYST</option>
                          <option value="viewer">VIEWER</option>
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            u.status === 'active'
                              ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                              : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#667085]">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never logged in'}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#667085]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant={u.status === 'active' ? 'outline' : 'primary'}
                          size="sm"
                          disabled={isCurrent}
                          onClick={() => handleStatusToggle(u)}
                        >
                          {u.status === 'active' ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-[#E4E7EC] bg-white p-6 shadow-xl relative">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E4E7EC]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                  <UserPlus size={18} />
                </div>
                <h3 className="font-bold text-[#172033] text-base">Provision New SOC Account</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#667085] hover:text-[#172033] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-1.5">Operational Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="j.doe@threatx.io"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-1.5">Initial Password (min 8 chars)</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] uppercase tracking-wider mb-1.5">RBAC Role Permission</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#E4E7EC] text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer"
                >
                  <option value="analyst">Analyst (Triage, Alerts, Anomaly Analysis)</option>
                  <option value="admin">Administrator (Full Access & User Management)</option>
                  <option value="viewer">Viewer (Read-Only Dashboards & Telemetry)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E4E7EC] mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
