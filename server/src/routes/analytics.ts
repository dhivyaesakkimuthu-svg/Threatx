import { Router } from 'express';
import { getDb } from '../db/store.js';
import { ThreatModel } from '../models/Threat.js';
import { AlertModel } from '../models/Alert.js';
import { ServerModel } from '../models/Server.js';
import { SessionModel } from '../models/Session.js';
import { ActivityModel } from '../models/Activity.js';
import { IntelligenceDecisionModel } from '../models/IntelligenceDecision.js';
import { isDbConnected } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/analytics - Comprehensive SOC security and threat analytics
router.get('/', authenticateToken, async (_req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last24h = new Date(now.getTime() - 24 * 3600 * 1000);

  if (isDbConnected()) {
    try {
      const [
        totalThreats,
        activeThreats,
        threatsToday,
        allThreats,
        totalAlerts,
        criticalAlerts,
        resolvedAlerts,
        alertsByStatusDocs,
        totalServers,
        onlineServers,
        serversList,
        activeSessions,
        totalSessions,
        totalActivities,
        activitiesToday,
        totalAnalyzed,
        anomaliesDetected,
      ] = await Promise.all([
        ThreatModel.countDocuments(),
        ThreatModel.countDocuments({ status: { $in: ['new', 'active', 'open', 'investigating'] }, acknowledged: false }),
        ThreatModel.countDocuments({ detectedAt: { $gte: startOfToday } }),
        ThreatModel.find().select('type threatType severity riskLevel detectedAt timestamp status acknowledged').lean(),
        AlertModel.countDocuments(),
        AlertModel.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } }),
        AlertModel.countDocuments({ status: { $in: ['resolved', 'dismissed', 'closed'] } }),
        AlertModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        ServerModel.countDocuments(),
        ServerModel.countDocuments({ status: 'online' }),
        ServerModel.find().select('status health cpuUsage memoryUsage activeSessions').lean(),
        SessionModel.countDocuments({ status: 'active' }),
        SessionModel.countDocuments(),
        ActivityModel.countDocuments(),
        ActivityModel.countDocuments({ timestamp: { $gte: startOfToday } }),
        IntelligenceDecisionModel.countDocuments(),
        IntelligenceDecisionModel.countDocuments({ 'anomalies.0': { $exists: true } }),
      ]);

      const riskCounts = {
        critical: allThreats.filter((t) => (t.severity || '').toLowerCase() === 'critical').length,
        high: allThreats.filter((t) => (t.severity || '').toLowerCase() === 'high').length,
        medium: allThreats.filter((t) => (t.severity || '').toLowerCase() === 'medium').length,
        low: allThreats.filter((t) => (t.severity || '').toLowerCase() === 'low').length,
      };

      const threatTypeBreakdown: Record<string, number> = {};
      allThreats.forEach((t) => {
        const type = t.type || t.threatType || 'Suspicious Activity';
        threatTypeBreakdown[type] = (threatTypeBreakdown[type] || 0) + 1;
      });

      const alertsByStatus: Record<string, number> = {
        open: 0,
        investigating: 0,
        resolved: 0,
        dismissed: 0,
      };
      alertsByStatusDocs.forEach((item) => {
        const key = String(item._id || 'open').toLowerCase();
        alertsByStatus[key] = item.count;
      });

      const serverHealthDistribution = {
        healthy: serversList.filter((s) => s.health === 'healthy').length,
        warning: serversList.filter((s) => s.health === 'warning').length,
        degraded: serversList.filter((s) => s.health === 'degraded').length,
        critical: serversList.filter((s) => s.health === 'critical').length,
      };

      const securityScore = Math.max(
        0,
        Math.min(
          100,
          100 - riskCounts.critical * 12 - riskCounts.high * 6 - riskCounts.medium * 2 - (alertsByStatus.open || 0) * 2
        )
      );

      // 24 Hour timeline
      const nowMs = now.getTime();
      const timeline = Array.from({ length: 24 }, (_, i) => {
        const hourStart = nowMs - (23 - i) * 3600000;
        const hourEnd = hourStart + 3600000;
        const hourEvents = allThreats.filter((e) => {
          const t = new Date(e.detectedAt || e.timestamp || 0).getTime();
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
          critical: hourEvents.filter((e) => (e.severity || '').toLowerCase() === 'critical').length,
          high: hourEvents.filter((e) => (e.severity || '').toLowerCase() === 'high').length,
          medium: hourEvents.filter((e) => (e.severity || '').toLowerCase() === 'medium').length,
          low: hourEvents.filter((e) => (e.severity || '').toLowerCase() === 'low').length,
        };
      });

      return res.json({
        securityScore,
        activeThreats,
        totalThreats,
        threatsToday: threatsToday || allThreats.length,
        criticalAlerts,
        resolvedAlerts,
        totalAlerts,
        alertsByStatus,
        totalServers,
        onlineServers,
        serverHealthDistribution,
        activeSessions,
        totalSessions,
        totalActivities,
        eventsToday: activitiesToday || totalActivities,
        riskDistribution: riskCounts,
        threatTypeBreakdown,
        timeline,
        totalAnalyzed: totalAnalyzed || allThreats.length,
        anomaliesDetected: anomaliesDetected || riskCounts.critical + riskCounts.high,
        intelligenceMetrics: {
          totalAnalyzed: totalAnalyzed || allThreats.length,
          anomaliesDetected: anomaliesDetected || riskCounts.critical + riskCounts.high,
          highRiskCount: riskCounts.high,
          criticalRiskCount: riskCounts.critical,
          riskDistribution: riskCounts,
        },
        lastCalculated: now.toISOString(),
      });
    } catch (e: any) {
      console.warn('[Analytics Route] MongoDB aggregation note, fallback to store:', e.message);
    }
  }

  // Fallback store calculation
  const db = getDb();
  const threats = db.threats || db.threatEvents || [];
  const servers = db.servers || [];
  const sessions = db.sessions || [];
  const activities = db.activities || db.activityLogs || [];
  const alerts = db.alerts || [];

  const riskCounts = {
    low: threats.filter((t) => (t.severity || t.riskLevel || '').toLowerCase() === 'low').length,
    medium: threats.filter((t) => (t.severity || t.riskLevel || '').toLowerCase() === 'medium').length,
    high: threats.filter((t) => (t.severity || t.riskLevel || '').toLowerCase() === 'high').length,
    critical: threats.filter((t) => (t.severity || t.riskLevel || '').toLowerCase() === 'critical').length,
  };

  const threatTypeBreakdown: Record<string, number> = {};
  threats.forEach((t) => {
    const type = t.type || t.threatType || 'Unknown';
    threatTypeBreakdown[type] = (threatTypeBreakdown[type] || 0) + 1;
  });

  const alertsByStatus = {
    open: alerts.filter((a) => (a.status || 'open') === 'open').length,
    investigating: alerts.filter((a) => a.status === 'investigating').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
    dismissed: alerts.filter((a) => a.status === 'dismissed' || a.status === 'closed').length,
  };

  const serverHealthDistribution = {
    healthy: servers.filter((s) => (s.health || 'healthy') === 'healthy').length,
    warning: servers.filter((s) => s.health === 'warning').length,
    degraded: servers.filter((s) => s.health === 'degraded').length,
    critical: servers.filter((s) => s.health === 'critical').length,
  };

  const activeThreats = threats.filter((t) => !t.acknowledged && t.status !== 'mitigated').length;
  const criticalAlerts = alerts.filter((a) => (a.severity || '').toLowerCase() === 'critical' && a.status !== 'resolved').length;
  const resolvedAlerts = alerts.filter((a) => a.status === 'resolved' || a.status === 'dismissed').length;

  const securityScore = Math.max(
    0,
    Math.min(100, 100 - riskCounts.critical * 12 - riskCounts.high * 6 - riskCounts.medium * 2)
  );

  const nowMs = now.getTime();
  const timeline = Array.from({ length: 24 }, (_, i) => {
    const hourStart = nowMs - (23 - i) * 3600000;
    const hourEnd = hourStart + 3600000;
    const hourEvents = threats.filter((e) => {
      const t = new Date(e.timestamp || e.detectedAt || 0).getTime();
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
      critical: hourEvents.filter((e) => (e.severity || e.riskLevel || '').toLowerCase() === 'critical').length,
      high: hourEvents.filter((e) => (e.severity || e.riskLevel || '').toLowerCase() === 'high').length,
      medium: hourEvents.filter((e) => (e.severity || e.riskLevel || '').toLowerCase() === 'medium').length,
      low: hourEvents.filter((e) => (e.severity || e.riskLevel || '').toLowerCase() === 'low').length,
    };
  });

  res.json({
    securityScore,
    activeThreats,
    totalThreats: threats.length,
    threatsToday: threats.length,
    criticalAlerts,
    resolvedAlerts,
    totalAlerts: alerts.length,
    alertsByStatus,
    totalServers: servers.length,
    onlineServers: servers.filter((s) => s.status === 'online').length,
    serverHealthDistribution,
    activeSessions: sessions.filter((s) => s.status === 'active').length,
    totalSessions: sessions.length,
    totalActivities: activities.length,
    eventsToday: activities.length,
    riskDistribution: riskCounts,
    threatTypeBreakdown,
    timeline,
    lastCalculated: now.toISOString(),
  });
});

export default router;
