import { Router, Request, Response } from 'express';
import { threatIntelligenceService } from '../services/threatIntelligenceService.js';
import { IntelligenceDecisionModel } from '../models/IntelligenceDecision.js';
import { ThreatModel } from '../models/Threat.js';
import { isDbConnected } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/intelligence/analyze
 * Analyzes event and telemetry in real time, calculating deterministic explainable risk scores and anomaly detection.
 */
router.post('/analyze', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { event, telemetry } = req.body || {};
    
    // Perform AI analysis
    const result = threatIntelligenceService.analyze({ event, telemetry });

    // Optionally persist if explicitly requested or if it has threat context
    if (req.query.persist === 'true' && isDbConnected()) {
      await threatIntelligenceService.persistDecision(result, event, telemetry);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[Intelligence API Error]', err);
    return res.status(500).json({
      error: 'Failed to analyze threat event',
      message: err.message,
    });
  }
});

/**
 * GET /api/intelligence/decisions
 * Retrieves paginated list of recent AI threat intelligence decisions
 */
router.get('/decisions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const riskLevel = req.query.riskLevel ? String(req.query.riskLevel).toLowerCase() : null;
    const search = req.query.search ? String(req.query.search).trim() : null;

    const filter: any = {};
    if (riskLevel && riskLevel !== 'all') {
      filter.riskLevel = riskLevel;
    }

    if (search) {
      filter.$or = [
        { decisionId: { $regex: search, $options: 'i' } },
        { sourceIp: { $regex: search, $options: 'i' } },
        { eventType: { $regex: search, $options: 'i' } },
        { recommendedAction: { $regex: search, $options: 'i' } },
        { reasons: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }

    if (isDbConnected()) {
      const total = await IntelligenceDecisionModel.countDocuments(filter);
      const decisions = await IntelligenceDecisionModel.find(filter)
        .sort({ analyzedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return res.json({
        data: decisions,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    }

    return res.json({
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    });
  } catch (err: any) {
    console.error('[Intelligence Decisions API Error]', err);
    return res.status(500).json({ error: 'Failed to fetch intelligence decisions' });
  }
});

/**
 * GET /api/intelligence/stats
 * Overview intelligence statistics and platform risk metrics
 */
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (isDbConnected()) {
      const [totalDecisions, highCount, critCount, medCount, lowCount, recentAnomalies, avgScoreAgg] =
        await Promise.all([
          IntelligenceDecisionModel.countDocuments(),
          IntelligenceDecisionModel.countDocuments({ riskLevel: 'high' }),
          IntelligenceDecisionModel.countDocuments({ riskLevel: 'critical' }),
          IntelligenceDecisionModel.countDocuments({ riskLevel: 'medium' }),
          IntelligenceDecisionModel.countDocuments({ riskLevel: 'low' }),
          IntelligenceDecisionModel.find({ 'anomalies.0': { $exists: true } })
            .sort({ analyzedAt: -1 })
            .limit(10)
            .lean(),
          IntelligenceDecisionModel.aggregate([
            { $group: { _id: null, avgScore: { $avg: '$riskScore' } } },
          ]),
        ]);

      const avgRiskScore = avgScoreAgg.length > 0 ? Math.round(avgScoreAgg[0].avgScore) : 42;
      const totalAnomaliesCount = await IntelligenceDecisionModel.countDocuments({ 'anomalies.0': { $exists: true } });

      return res.json({
        totalAnalyzed: totalDecisions,
        anomaliesDetected: totalAnomaliesCount,
        highRiskCount: highCount,
        criticalRiskCount: critCount,
        averageRiskScore: avgRiskScore,
        overallRiskScore: Math.min(100, Math.round(avgRiskScore * 1.1)),
        riskDistribution: {
          low: lowCount,
          medium: medCount,
          high: highCount,
          critical: critCount,
        },
        recentAnomalies,
      });
    }

    return res.json({
      totalAnalyzed: 0,
      anomaliesDetected: 0,
      highRiskCount: 0,
      criticalRiskCount: 0,
      averageRiskScore: 0,
      overallRiskScore: 0,
      riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      recentAnomalies: [],
    });
  } catch (err: any) {
    console.error('[Intelligence Stats API Error]', err);
    return res.status(500).json({ error: 'Failed to fetch intelligence statistics' });
  }
});

export default router;
