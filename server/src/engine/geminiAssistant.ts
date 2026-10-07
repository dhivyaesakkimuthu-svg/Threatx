import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Incident, ThreatEvent } from '../types.js';

export interface GeminiAnalysis {
  summary: string;
  likelyCause: string | null;
  suggestedActions: string[];
  confidenceScore: number | null; // 0-100
  generatedAt: string;            // ISO timestamp
  isAiGenerated?: boolean;
  cached?: boolean;
}

// In-memory cache (10 min TTL) to avoid redundant API consumption
interface CacheEntry {
  timestamp: number;
  result: GeminiAnalysis;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function analyzeIncident(
  incident: Incident,
  relatedEvents: ThreatEvent[]
): Promise<GeminiAnalysis> {
  const cacheKey = `incident:${incident.id}:${incident.updatedAt || incident.createdAt}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { ...cached.result, cached: true };
  }

  const affectedUser = relatedEvents[0]?.username || 'Monitored User';
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // Mode 1: WITHOUT GEMINI_API_KEY or with default placeholder
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const isHigh = incident.riskLevel === 'High';
    const fallbackCause =
      relatedEvents.length > 0
        ? `Anomalous activity pattern triggered by ${relatedEvents[0].threatType} from source IP ${relatedEvents[0].ipAddress}.`
        : 'Behavioral deviation matching SOC severity thresholds.';

    const fallback: GeminiAnalysis = {
      summary: `[Heuristic Mode] Incident "${incident.title}" for user "${affectedUser}". Gemini API key is not configured (set GEMINI_API_KEY in server/.env for live LLM reasoning).`,
      likelyCause: fallbackCause,
      suggestedActions: [
        'Revoke active session tokens and terminate concurrent terminals.',
        'Enforce mandatory multi-factor authentication (MFA) challenge.',
        'Isolate the host or restrict unauthorized subnet egress.',
        'Review audit log entries for unauthorized data movement.',
      ],
      confidenceScore: isHigh ? 88 : 75,
      generatedAt: new Date().toISOString(),
      isAiGenerated: false,
    };
    return fallback;
  }

  // Mode 2: WITH GEMINI_API_KEY
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert Cyber Security Operations Center (SOC) Tier-3 Incident Response AI analyst for TheadX.
Analyze the following security incident and associated threat telemetry payload:

Incident Details:
- Title: ${incident.title}
- Risk Level: ${incident.riskLevel}
- Status: ${incident.status}
- Affected User: ${affectedUser}
- Description: ${incident.description}
- Creation Timestamp: ${incident.createdAt}

Associated Threat Payloads (${relatedEvents.length} events):
${relatedEvents
  .map(
    (e, idx) =>
      `[Event ${idx + 1}] Type: ${e.threatType}, Risk: ${e.riskLevel}, IP: ${e.ipAddress}, Device: ${e.device}, Time: ${e.timestamp}, Explanation: ${e.explanation}`
  )
  .join('\n')}

Respond in valid JSON format strictly matching this schema (do NOT include Markdown formatting or code ticks outside the JSON):
{
  "summary": "Executive summary of the incident and threat trajectory",
  "likelyCause": "Specific root cause hypothesis based on the payload",
  "suggestedActions": ["Action 1", "Action 2", "Action 3", "Action 4"],
  "confidenceScore": 92
}
`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const result: GeminiAnalysis = {
      summary: parsed.summary || `AI Incident Analysis for "${incident.title}".`,
      likelyCause: parsed.likelyCause || 'Suspicious behavioral deviation detected in access patterns.',
      suggestedActions: Array.isArray(parsed.suggestedActions) && parsed.suggestedActions.length > 0
        ? parsed.suggestedActions
        : [
            'Revoke user credentials and session cookies.',
            'Isolate affected endpoints from internal networks.',
            'Audit recent file access events.',
          ],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 88,
      generatedAt: new Date().toISOString(),
      isAiGenerated: true,
    };

    cache.set(cacheKey, { timestamp: Date.now(), result });
    return result;
  } catch (err) {
    // Graceful fallback if Gemini API is unreachable or returns an error
    console.error('[Gemini Assistant] Live API call failed, degrading gracefully to heuristic analysis:', err);
    return {
      summary: `[Fallback Mode] Incident analysis for "${incident.title}". Note: Live Gemini API request failed (check API key or network connectivity).`,
      likelyCause: relatedEvents.length > 0
        ? `Suspicious behavioral pattern associated with ${relatedEvents[0].threatType}.`
        : 'Heuristic anomaly detected for monitored account.',
      suggestedActions: [
        'Temporarily suspend user session credentials.',
        'Block offending source IP address at firewall.',
        'Review audit log entries for data exfiltration.',
      ],
      confidenceScore: 78,
      generatedAt: new Date().toISOString(),
      isAiGenerated: false,
    };
  }
}
