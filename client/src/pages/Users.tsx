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
  UserCheck,
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
    <div className="space-y-6 animate-fade-in pb-12">
      <Topbar
        title="User & Access Management"
        subtitle="Role-Based Access Control (RBAC), Identity Governance & Account Status"
      />

      {/* Notifications */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-500 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-600 hover:text-gray-900" aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-500 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-gray-900" aria-label="Dismiss success">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Overview Stat Cards - High-Contrast Dark Cybersecurity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200  shadow-xl">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>TOTAL USERS</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <UsersIcon size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 font-mono mt-3">{counts.total}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {counts.active} Active accounts
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200  shadow-xl">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>ADMINISTRATORS</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 font-mono mt-3">{counts.admins}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Full privileged access</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200  shadow-xl">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>SOC ANALYSTS</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Shield size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600 font-mono mt-3">{counts.analysts}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Triage &amp; Investigation</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200  shadow-xl">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>VIEWERS</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-500/30">
              <Eye size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono mt-3">{counts.viewers}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Read-only audit level</div>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-gray-200  shadow-xl">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, email, role..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50/70 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 transition-all font-sans"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-gray-50/70 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
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
            className="px-3.5 py-2.5 rounded-xl bg-gray-50/70 border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>

          <Button
            variant="outline"
            size="md"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />}
            onClick={fetchUsers}
            aria-label="Refresh Users"
          >
            Refresh
          </Button>
        </div>

        {/* Create User Button */}
        <Button
          variant="primary"
          size="md"
          icon={<UserPlus size={16} />}
          onClick={() => setShowCreateModal(true)}
        >
          Provision User
        </Button>
      </div>

      {/* Users Table - High Contrast Dark Cybersecurity */}
      <div className="bg-white rounded-2xl border border-gray-200  shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-[#060911]/90 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="py-4 px-5">User</th>
                <th className="py-4 px-5">Role (RBAC)</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Last Login</th>
                <th className="py-4 px-5">Created Date</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-600" />
                    <span className="text-sm font-semibold">Fetching user identities from MongoDB...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No users matching search criteria found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-100/40 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${
                              u.role === 'admin'
                                ? 'bg-rose-50 text-rose-500 border-rose-200'
                                : u.role === 'analyst'
                                ? 'bg-blue-50 text-blue-500 border-blue-200'
                                : 'bg-emerald-50 text-emerald-500 border-emerald-500/30'
                            }`}
                          >
                            {u.name ? u.name.substring(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-500 border border-blue-300">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <select
                          value={u.role}
                          disabled={isCurrent}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                            u.role === 'admin'
                              ? 'bg-rose-950/60 text-rose-500 border-rose-500/40'
                              : u.role === 'analyst'
                              ? 'bg-blue-950/60 text-blue-500 border-blue-300'
                              : 'bg-emerald-950/60 text-emerald-500 border-emerald-500/40'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="admin" className="bg-white text-rose-500">ADMIN</option>
                          <option value="analyst" className="bg-white text-blue-500">ANALYST</option>
                          <option value="viewer" className="bg-white text-emerald-500">VIEWER</option>
                        </select>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-600 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>

                      <td className="py-4 px-5 font-mono text-xs text-gray-600">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never logged in'}
                      </td>

                      <td className="py-4 px-5 font-mono text-xs text-gray-600">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-4 px-5 text-right">
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

      {/* Create User Modal - Dark Cybersecurity Glassmorphism */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-[#0A0E1A] p-6 shadow-lg relative">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-gray-900 shadow-lg shadow-blue-500/20">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Provision New SOC Account</h3>
                  <p className="text-xs text-gray-500">Add an authenticated analyst or operator</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-900 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Operational Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="j.doe@threatx.io"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Initial Password (min 8 chars)</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">RBAC Role Permission</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="analyst">Analyst (Triage, Alerts, Anomaly Analysis)</option>
                  <option value="admin">Administrator (Full Access &amp; User Management)</option>
                  <option value="viewer">Viewer (Read-Only Dashboards &amp; Telemetry)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-200 mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
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
