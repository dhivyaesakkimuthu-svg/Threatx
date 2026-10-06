import axios from 'axios';
import type {
  DashboardStats,
  Alert,
  Server,
  ThreatEvent,
  Incident,
  User,
  AuthResponse,
} from '../types';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((res) => res.data),
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((res) => res.data),
  getCurrentUser: () =>
    apiClient.get<{ user: User }>('/auth/me').then((res) => res.data.user),

  // Dashboard & Alerts
  getDashboardStats: () =>
    apiClient.get<DashboardStats>('/dashboard/stats').then((res) => res.data),
  getAlerts: () =>
    apiClient.get<Alert[]>('/dashboard/alerts').then((res) => res.data),
  markAlertRead: (id: string) =>
    apiClient.patch(`/dashboard/alerts/${id}/read`).then((res) => res.data),
  markAllAlertsRead: () =>
    apiClient.post('/dashboard/alerts/read-all').then((res) => res.data),

  // Servers
  getServers: () =>
    apiClient.get<Server[]>('/servers').then((res) => res.data),
  getServer: (id: string) =>
    apiClient.get<Server>(`/servers/${id}`).then((res) => res.data),
  createServer: (data: { name: string; hostname: string; os?: string; ipAddress?: string }) =>
    apiClient.post<Server>('/servers', data).then((res) => res.data),
  deleteServer: (id: string) =>
    apiClient.delete(`/servers/${id}`).then((res) => res.data),
  regenerateKey: (id: string) =>
    apiClient.post<{ apiKey: string }>(`/servers/${id}/regenerate-key`).then((res) => res.data),

  // Events
  getEvents: (params?: { limit?: number; riskLevel?: string }) =>
    apiClient.get<ThreatEvent[]>('/events', { params }).then((res) => res.data),
  getEventStats: () =>
    apiClient.get<Record<string, number>>('/events/stats').then((res) => res.data),
  acknowledgeEvent: (id: string) =>
    apiClient.patch(`/events/${id}/acknowledge`).then((res) => res.data),

  // Incidents
  getIncidents: (status?: string) =>
    apiClient.get<Incident[]>('/incidents', { params: status ? { status } : undefined }).then((res) => res.data),
  getIncident: (id: string) =>
    apiClient.get<Incident>(`/incidents/${id}`).then((res) => res.data),
  updateIncident: (id: string, data: { status?: string; assignedTo?: string }) =>
    apiClient.patch<Incident>(`/incidents/${id}`, data).then((res) => res.data),
  addIncidentNote: (id: string, data: { action: string; analyst: string; notes: string; status?: string }) =>
    apiClient.post<Incident>(`/incidents/${id}/notes`, data).then((res) => res.data),
  aiInvestigate: (id: string) =>
    apiClient.post<{ success: boolean; report: any }>(`/incidents/${id}/ai-investigate`).then((res) => res.data),
  analyzeIncidentAssistant: (id: string) =>
    apiClient.post<{ success: boolean; incidentId: string; analysis: any }>(`/assistant/incident/${id}`).then((res) => res.data),

  // Demo Agent
  getAgentStatus: () =>
    apiClient
      .get<{
        demoServerRunning: boolean;
        agentConnected: boolean;
        server: Server | null;
        targetUrl: string;
        targetMetrics: any;
      }>('/agent/status')
      .then((res) => res.data),
  blockDemoUser: (username: string) =>
    apiClient
      .post<{ success: boolean; targetResponse: any }>('/agent/block-user', { username })
      .then((res) => res.data),
};
