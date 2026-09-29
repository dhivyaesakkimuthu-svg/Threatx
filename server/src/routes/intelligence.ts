import { Router, Request, Response } from 'express';
import { threatIntelligenceService } from '../services/threatIntelligenceService.js';
import { abuseIPDBService } from '../services/abuseIpdbService.js';
import { virusTotalService } from '../services/virusTotalService.js';
import { geminiService } from '../services/geminiService.js';
import { IntelligenceDecisionModel } from '../models/IntelligenceDecision.js';
import { isDbConnected } from '../config/db.js';
import { authenticateToken, AuthenticatedRequest, recordAuditLog } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/intelligence/status
 * Returns health and configuration status for AbuseIPDB, VirusTotal, and Gemini integrations
 */
router.get('/status', authenticateToken, async (_req: Request, res: Response) => {
  return res.json({
    abuseIpdb: {
      configured: abuseIPDBService.isConfigured(),
      service: 'AbuseIPDB v2 Threat Reputation',
      status: abuseIPDBService.isConfigured() ? 'active' : 'unconfigured',
    },
    virusTotal: {
      configured: virusTotalService.isConfigured(),
      service: 'VirusTotal v3 Multi-Engine Scanner',
      status: virusTotalService.isConfigured() ? 'active' : 'unconfigured',
    },
    gemini: {
      configured: geminiService.isConfigured(),
      service: 'Google Gemini Threat Sentinel & SOC Copilot',
      status: geminiService.isConfigured() ? 'active' : 'unconfigured',
    },
  });
});

/**
 * POST /api/intelligence/lookup/ip
 * Live IOC lookup for IP address via AbuseIPDB and VirusTotal
 */
router.post('/lookup/ip', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ip } = req.body || {};
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ error: 'Valid IP address string is required' });
    }

    const cleanIp = ip.trim();
    let abuseData: any = null;
    let vtData: any = null;
    const errors: string[] = [];

    // Parallel external intelligence lookups
    const [abuseResult, vtResult] = await Promise.allSettled([
      abuseIPDBService.isConfigured()
        ? abuseIPDBService.checkIp(cleanIp)
        : Promise.reject(new Error('AbuseIPDB not configured')),
      virusTotalService.isConfigured()
        ? virusTotalService.checkIp(cleanIp)
        : Promise.reject(new Error('VirusTotal not configured')),
    ]);

    if (abuseResult.status === 'fulfilled') {
      abuseData = abuseResult.value;
    } else {
      errors.push(`AbuseIPDB: ${abuseResult.reason?.message || 'Lookup failed'}`);
    }

    if (vtResult.status === 'fulfilled') {
      vtData = vtResult.value;
    } else {
      errors.push(`VirusTotal: ${vtResult.reason?.message || 'Lookup failed'}`);
    }

    // Consolidated Threat Assessment
    const abuseScore = abuseData?.abuseConfidenceScore ?? 0;
    const vtMalicious = vtData?.stats?.malicious ?? 0;
    const isPrivate = abuseData?.isPrivateIp || vtData?.target === 'Private RFC-1918 / Loopback';

    let verdict: 'clean' | 'suspicious' | 'malicious' = 'clean';
    let combinedScore = 0;

    if (!isPrivate) {
      if (abuseScore >= 50 || vtMalicious >= 3) {
        verdict = 'malicious';
        combinedScore = Math.max(abuseScore, vtMalicious * 15, 80);
      } else if (abuseScore >= 15 || vtMalicious > 0 || (vtData?.stats?.suspicious ?? 0) >= 2) {
        verdict = 'suspicious';
        combinedScore = Math.max(abuseScore, 45);
      } else {
        verdict = 'clean';
        combinedScore = Math.min(abuseScore, 20);
      }
    }

    await recordAuditLog({
      req,
      action: 'IOC_IP_LOOKUP',
      resourceType: 'intelligence',
      resourceId: cleanIp,
      metadata: { verdict, combinedScore, abuseScore, vtMalicious },
    });

    return res.json({
      ip: cleanIp,
      verdict,
      threatScore: Math.min(100, combinedScore),
      isPrivate,
      country: abuseData?.countryName || vtData?.country || 'Unknown',
      countryCode: abuseData?.countryCode || 'XX',
      isp: abuseData?.isp || vtData?.asOwner || 'Unknown',
      domain: abuseData?.domain || '',
      abuseIpdb: abuseData,
      virusTotal: vtData,
      errors: errors.length > 0 ? errors : undefined,
      analyzedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[IOC IP Lookup Error]', err);
    return res.status(500).json({ error: 'Failed to complete IP threat lookup', message: err.message });
  }
});

/**
 * POST /api/intelligence/lookup/domain
 * Live IOC lookup for Domain via VirusTotal
 */
router.post('/lookup/domain', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { domain } = req.body || {};
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'Valid domain string is required' });
    }

    const cleanDomain = domain.trim().toLowerCase();
    const vtData = await virusTotalService.checkDomain(cleanDomain);

    await recordAuditLog({
      req,
      action: 'IOC_DOMAIN_LOOKUP',
      resourceType: 'intelligence',
      resourceId: cleanDomain,
      metadata: { verdict: vtData.verdict, detectionRate: vtData.detectionRate },
    });

    return res.json({
      domain: cleanDomain,
      verdict: vtData.verdict,
      threatScore: vtData.stats.malicious >= 3 ? 85 : vtData.stats.malicious > 0 ? 50 : 10,
      virusTotal: vtData,
      analyzedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[IOC Domain Lookup Error]', err);
    return res.status(500).json({ error: 'Failed to complete domain threat lookup', message: err.message });
  }
});

/**
 * POST /api/intelligence/lookup/hash
 * Live IOC lookup for File Hash (MD5, SHA1, SHA256) via VirusTotal
 */
router.post('/lookup/hash', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hash } = req.body || {};
    if (!hash || typeof hash !== 'string') {
      return res.status(400).json({ error: 'Valid file hash string is required' });
    }

    const cleanHash = hash.trim().toLowerCase();
    const vtData = await virusTotalService.checkFileHash(cleanHash);

    await recordAuditLog({
      req,
      action: 'IOC_HASH_LOOKUP',
      resourceType: 'intelligence',
      resourceId: cleanHash,
      metadata: { verdict: vtData.verdict, detectionRate: vtData.detectionRate, label: vtData.suggestedThreatLabel },
    });

    return res.json({
      hash: cleanHash,
      verdict: vtData.verdict,
      threatScore: vtData.stats.malicious >= 3 ? 90 : vtData.stats.malicious > 0 ? 55 : 10,
      fileName: vtData.meaningfulName,
      virusTotal: vtData,
      analyzedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[IOC Hash Lookup Error]', err);
    return res.status(500).json({ error: 'Failed to complete file hash threat lookup', message: err.message });
  }
});

/**
 * POST /api/intelligence/copilot/chat
 * Interactive SOC Copilot conversation powered by Google Gemini AI
 */
router.post('/copilot/chat', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, context, chatHistory } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message prompt is required' });
    }

    const copilotResponse = await geminiService.copilotChat(message, context, chatHistory || []);

    return res.json(copilotResponse);
  } catch (err: any) {
    console.error('[SOC Copilot Chat Error]', err);
    return res.status(500).json({ error: 'SOC Copilot request failed', message: err.message });
  }
});

/**
 * POST /api/intelligence/copilot/analyze
 * Deep AI Incident Analysis with MITRE ATT&CK, Root Cause, Playbooks & Forensic Queries
 */
router.post('/copilot/analyze', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { event, telemetry, server, enrichWithIoc = true } = req.body || {};

    let abuseData: any = null;
    let vtData: any = null;
    const sourceIp = String(event?.source_ip || event?.ip_address || event?.source || event?.ip || '').trim();

    // Optionally fetch live AbuseIPDB + VirusTotal IOC context for the Gemini prompt
    if (enrichWithIoc && sourceIp && !abuseIPDBService.isPrivateIp(sourceIp)) {
      await Promise.allSettled([
        (async () => {
          if (abuseIPDBService.isConfigured()) {
            abuseData = await abuseIPDBService.checkIp(sourceIp);
          }
        })(),
        (async () => {
          if (virusTotalService.isConfigured()) {
            vtData = await virusTotalService.checkIp(sourceIp);
          }
        })(),
      ]);
    }

    const aiAnalysis = await geminiService.analyzeThreatIncident({
      event,
      telemetry,
      abuseIpdb: abuseData,
      virusTotal: vtData,
      server,
    });

    await recordAuditLog({
      req,
      action: 'AI_INCIDENT_DEEP_ANALYSIS',
      resourceType: 'threat',
      resourceId: event?.threatId || event?.id || sourceIp,
      metadata: { threatScore: aiAnalysis.threatScore, severity: aiAnalysis.severity, model: aiAnalysis.modelUsed },
    });

    return res.json({
      ...aiAnalysis,
      iocEnrichment: {
        abuseIpdb: abuseData,
        virusTotal: vtData,
      },
    });
  } catch (err: any) {
    console.error('[Deep AI Analysis Error]', err);
    return res.status(500).json({ error: 'Failed to complete AI threat analysis', message: err.message });
  }
});

/**
 * POST /api/intelligence/generate-report
 * Generates audit-ready Markdown incident and CISO threat report using Gemini AI
 */
router.post('/generate-report', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const incidentData = req.body || {};
    const reportResult = await geminiService.generateExecutiveReport(incidentData);

    await recordAuditLog({
      req,
      action: 'AI_GENERATE_CISO_REPORT',
      resourceType: 'report',
      resourceId: incidentData?.incidentId || incidentData?.threatId || 'SOC-REPORT',
      metadata: { title: reportResult.title, riskLevel: reportResult.riskLevel },
    });

    return res.json(reportResult);
  } catch (err: any) {
    console.error('[AI Report Generation Error]', err);
    return res.status(500).json({ error: 'Failed to generate AI executive report', message: err.message });
  }
});

/**
 * POST /api/intelligence/analyze
 * Analyzes event and telemetry in real time with optional AbuseIPDB/VirusTotal live enrichment
 */
router.post('/analyze', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { event, telemetry, enrich = true } = req.body || {};

    // Perform AI analysis (with live IOC enrichment if enrich is true)
    const result = enrich
      ? await threatIntelligenceService.analyzeAsync({ event, telemetry })
      : threatIntelligenceService.analyze({ event, telemetry });

    // Optionally persist if explicitly requested
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
