const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  getDashboardStats: () => request<import('../types').DashboardStats>('/dashboard/stats'),
  getAlerts: () => request<import('../types').Alert[]>('/dashboard/alerts'),
  markAlertRead: (id: string) => request(`/dashboard/alerts/${id}/read`, { method: 'PATCH' }),

  getServers: () => request<import('../types').Server[]>('/servers'),
  getServer: (id: string) => request<import('../types').Server>(`/servers/${id}`),
  createServer: (data: { name: string; hostname: string; os?: string; ipAddress?: string }) =>
    request<import('../types').Server>('/servers', { method: 'POST', body: JSON.stringify(data) }),
  deleteServer: (id: string) => request(`/servers/${id}`, { method: 'DELETE' }),
  regenerateKey: (id: string) => request<{ apiKey: string }>(`/servers/${id}/regenerate-key`, { method: 'POST' }),

  getEvents: (params?: { limit?: number; riskLevel?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.riskLevel) q.set('riskLevel', params.riskLevel);
    return request<import('../types').ThreatEvent[]>(`/events?${q}`);
  },
  getEventStats: () => request<Record<string, number>>('/events/stats'),
  acknowledgeEvent: (id: string) => request(`/events/${id}/acknowledge`, { method: 'PATCH' }),

  getIncidents: (status?: string) => {
    const q = status ? `?status=${status}` : '';
    return request<import('../types').Incident[]>(`/incidents${q}`);
  },
  getIncident: (id: string) => request<import('../types').Incident>(`/incidents/${id}`),
  updateIncident: (id: string, data: { status?: string; assignedTo?: string }) =>
    request<import('../types').Incident>(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  addIncidentNote: (id: string, data: { action: string; analyst: string; notes: string; status?: string }) =>
    request<import('../types').Incident>(`/incidents/${id}/notes`, { method: 'POST', body: JSON.stringify(data) }),
  markAllAlertsRead: () => request('/dashboard/alerts/read-all', { method: 'POST' }),
};
