import { Router } from 'express';
import { getDb, persistDb } from '../db/store.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/stats', requireAuth, (_req, res) => {
  const db = getDb();
  const onlineServers = db.servers.filter((s) => s.status === 'online').length;
  const uniqueUsers = new Set(db.activityLogs.map((l) => l.userId)).size;
  const recentThreats = db.threatEvents.filter(
    (e) => Date.now() - new Date(e.timestamp).getTime() < 86400000
  );
  const unacknowledged = recentThreats.filter((e) => !e.acknowledged);

  const riskDistribution = {
    low: db.threatEvents.filter((e) => e.riskLevel === 'Low').length,
    medium: db.threatEvents.filter((e) => e.riskLevel === 'Medium').length,
    high: db.threatEvents.filter((e) => e.riskLevel === 'High').length,
  };

  const highCount = riskDistribution.high;
  const securityScore = Math.max(0, Math.min(100, 100 - highCount * 3 - riskDistribution.medium * 1));

  const recentLogins = db.activityLogs
    .filter((l) => l.eventType === 'login' || l.eventType === 'failed_login')
    .slice(-10)
    .reverse()
    .map((l) => ({
      id: l.id,
      username: l.username,
      ipAddress: l.ipAddress,
      device: l.device,
      location: l.location ? `${l.location.city}, ${l.location.country}` : 'Unknown',
      timestamp: l.timestamp,
      success: l.success,
    }));

  const now = Date.now();
  const threatTimeline = Array.from({ length: 24 }, (_, i) => {
    const hourStart = now - (23 - i) * 3600000;
    const hourEnd = hourStart + 3600000;
    const hourEvents = db.threatEvents.filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= hourStart && t < hourEnd;
    });
    const label = new Date(hourStart).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return {
      time: label,
      count: hourEvents.length,
      high: hourEvents.filter((e) => e.riskLevel === 'High').length,
      medium: hourEvents.filter((e) => e.riskLevel === 'Medium').length,
      low: hourEvents.filter((e) => e.riskLevel === 'Low').length,
    };
  });

  res.json({
    totalServers: db.servers.length,
    activeUsers: uniqueUsers || db.behaviorProfiles.length,
    liveThreats: unacknowledged.length,
    securityScore,
    riskDistribution,
    recentLogins,
    threatTimeline,
  });
});

router.get('/alerts', requireAuth, (_req, res) => {
  res.json(getDb().alerts);
});

router.patch('/alerts/:id/read', requireAuth, (req, res) => {
  const db = getDb();
  const alert = db.alerts.find((a) => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.read = true;
  persistDb();
  res.json(alert);
});

router.post('/alerts/read-all', requireAuth, (_req, res) => {
  const db = getDb();
  db.alerts.forEach((a) => {
    a.read = true;
  });
  persistDb();
  res.json({ success: true });
});

export default router;
