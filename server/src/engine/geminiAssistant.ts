import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Incident, ThreatEvent } from '../types.js';

interface GeminiAnalysisResult {
  summary: string;
  likelyCause: string;
  suggestedActions: string[];
  confidenceScore: number;
  cached?: boolean;
}

// 10-minute in-memory cache to prevent duplicate calls and conserve quota
interface CacheEntry {
  timestamp: number;
  result: GeminiAnalysisResult;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function analyzeIncident(
  incident: Incident,
  relatedEvents: ThreatEvent[]
): Promise<GeminiAnalysisResult> {
  const cacheKey = `incident:${incident.id}:${incident.updatedAt || incident.createdAt}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { ...cached.result, cached: true };
  }

  const affectedUser = relatedEvents[0]?.username || 'Monitored User';
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const fallback: GeminiAnalysisResult = {
      summary: `[Fallback Analysis] High risk incident "${incident.title}" for account "${affectedUser}". Detected ${relatedEvents.length} associated anomalous threat payloads.`,
      likelyCause:
        relatedEvents.length > 0
          ? `Anomalous activity pattern triggered by ${relatedEvents[0].threatType} from IP ${relatedEvents[0].ipAddress}.`
          : 'Suspicious behavioral deviation matching high-severity threat detection heuristics.',
      suggestedActions: [
        'Temporarily revoke or suspend active user session tokens.',
        'Enforce mandatory multi-factor authentication reset.',
        'Isolate the host or restrict subnet communication.',
        'Review audit log entries for unauthorized data exfiltration.',
      ],
      confidenceScore: 88,
    };
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert Cyber Security Operations Center (SOC) AI analyst for TheadX.
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

Respond in valid JSON format strictly matching this schema (do NOT include Markdown ticks or formatting outside the JSON):
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

    const result: GeminiAnalysisResult = {
      summary: parsed.summary || 'Incident analyzed by Gemini AI.',
      likelyCause: parsed.likelyCause || 'Suspicious behavioral deviation detected.',
      suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [
        'Revoke user credentials.',
        'Isolate affected endpoints.',
      ],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 85,
    };

    cache.set(cacheKey, { timestamp: Date.now(), result });
    return result;
  } catch (err) {
    console.error('[Gemini Assistant] Analysis error:', err);
    return {
      summary: `[AI Fallback] Incident analysis for "${incident.title}".`,
      likelyCause: `Heuristic anomaly detected for user ${affectedUser}.`,
      suggestedActions: [
        'Perform credential revocation on affected account.',
        'Block offending source IP address.',
        'Audit recent file access logs.',
      ],
      confidenceScore: 75,
    };
  }
}
