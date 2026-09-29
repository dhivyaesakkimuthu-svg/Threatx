import axios from 'axios';

export interface MitreAttackMapping {
  tactic: string;
  technique: string;
  id: string;
  description: string;
}

export interface ForensicCommand {
  command: string;
  platform: 'linux' | 'windows' | 'splunk' | 'kql' | 'sigma' | 'generic';
  purpose: string;
}

export interface GeminiThreatAnalysis {
  summary: string;
  threatScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rootCauseAnalysis: string;
  mitreAttack: MitreAttackMapping[];
  impactAssessment: string;
  immediateActions: string[];
  playbook: {
    containment: string[];
    eradication: string[];
    recovery: string[];
  };
  forensicCommands: ForensicCommand[];
  hardeningRecommendations: string[];
  confidence: number;
  modelUsed: string;
  analyzedAt: string;
}

export interface GeminiChatResponse {
  reply: string;
  suggestions?: string[];
  modelUsed: string;
}

export interface GeminiReportResponse {
  title: string;
  summary: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  markdownReport: string;
  generatedAt: string;
  modelUsed: string;
}

class GeminiService {
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly primaryModel = 'gemini-3.5-flash';
  private readonly fallbackModel = 'gemini-3.8-flash';

  public isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10);
  }

  /**
   * Low-level helper to generate content from Gemini API with fallback
   */
  public async generateContent(prompt: string, systemInstruction?: string, temperature = 0.2): Promise<{ text: string; model: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API Key is not configured in server environment.');
    }

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-2.0-flash-lite',
      this.primaryModel,
      this.fallbackModel,
      'gemini-flash-latest',
    ];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const url = `${this.baseUrl}/${model}:generateContent?key=${apiKey}`;


        const payload: any = {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
        };

        if (systemInstruction) {
          payload.systemInstruction = {
            parts: [{ text: systemInstruction }],
          };
        }

        const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 25000,
        });

        const candidate = response.data?.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;

        if (text) {
          return { text, model };
        }
      } catch (err: any) {
        lastError = err;
        const msg = err.response?.data?.error?.message || err.message;
        console.warn(`[Gemini API Warning] Model ${model} failed: ${msg}. Attempting fallback...`);
      }
    }

    const finalErrMsg = lastError?.response?.data?.error?.message || lastError?.message || 'Unknown Gemini API error';
    throw new Error(`Gemini AI service unavailable: ${finalErrMsg}`);
  }

  /**
   * Helper to safely extract and parse JSON from LLM markdown block
   */
  private parseJsonFromResponse(text: string): any {
    try {
      // Remove markdown code fences if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();
      return JSON.parse(cleanText);
    } catch (e) {
      console.warn('[GeminiService] Could not directly parse JSON from response, returning fallback structure');
      return null;
    }
  }

  /**
   * Deep AI Threat & Incident Analysis
   */
  public async analyzeThreatIncident(context: {
    event?: any;
    telemetry?: any;
    abuseIpdb?: any;
    virusTotal?: any;
    server?: any;
  }): Promise<GeminiThreatAnalysis> {
    const systemPrompt = `You are ThreatX AI Sentinel, a Tier-3 Principal Cyber Threat Intelligence & Incident Response Commander.
Analyze the provided telemetry, event data, AbuseIPDB reputation, and VirusTotal IOC verdict.
Provide a deterministic, rigorous security assessment formatted strictly as a JSON object without markdown fences, conforming to this schema:
{
  "summary": "Concise 2-3 sentence executive summary of the threat and potential adversary intent",
  "threatScore": number (0-100),
  "severity": "low" | "medium" | "high" | "critical",
  "rootCauseAnalysis": "Technical breakdown of attack vector, initial access method, and lateral movement probability",
  "mitreAttack": [
    {
      "tactic": "Initial Access / Credential Access / etc",
      "technique": "Technique Name",
      "id": "T1110.001",
      "description": "How the observed event maps to this MITRE technique"
    }
  ],
  "impactAssessment": "Potential operational, data confidentiality, or infrastructure damage if unmitigated",
  "immediateActions": ["Action 1", "Action 2", "Action 3"],
  "playbook": {
    "containment": ["Step 1", "Step 2"],
    "eradication": ["Step 1", "Step 2"],
    "recovery": ["Step 1", "Step 2"]
  },
  "forensicCommands": [
    {
      "platform": "linux" | "windows" | "splunk" | "kql",
      "command": "Exact terminal or query command",
      "purpose": "What this command uncovers"
    }
  ],
  "hardeningRecommendations": ["Hardening step 1", "Hardening step 2"],
  "confidence": number (70-99)
}`;

    const userPrompt = `Evaluate this real-time SOC context:
Event Telemetry: ${JSON.stringify(context.event || {}, null, 2)}
Server Hardware Telemetry: ${JSON.stringify(context.telemetry || {}, null, 2)}
AbuseIPDB Threat Intelligence: ${JSON.stringify(context.abuseIpdb || 'No external lookup available', null, 2)}
VirusTotal IOC Verdict: ${JSON.stringify(context.virusTotal || 'No external lookup available', null, 2)}
Target Server Profile: ${JSON.stringify(context.server || {}, null, 2)}

Produce the JSON security analysis:`;

    const { text, model } = await this.generateContent(userPrompt, systemPrompt, 0.1);
    const parsed = this.parseJsonFromResponse(text);

    if (parsed && typeof parsed === 'object') {
      return {
        summary: parsed.summary || 'Security event evaluated by ThreatX AI Sentinel.',
        threatScore: Math.min(100, Math.max(0, Number(parsed.threatScore) || 50)),
        severity: ['low', 'medium', 'high', 'critical'].includes(parsed.severity) ? parsed.severity : 'medium',
        rootCauseAnalysis: parsed.rootCauseAnalysis || 'Automated behavioral anomaly flagged by detection engine.',
        mitreAttack: Array.isArray(parsed.mitreAttack) ? parsed.mitreAttack : [],
        impactAssessment: parsed.impactAssessment || 'Moderate operational risk under investigation.',
        immediateActions: Array.isArray(parsed.immediateActions) ? parsed.immediateActions : [],
        playbook: parsed.playbook || {
          containment: ['Isolate suspected source IP and terminate associated sessions.'],
          eradication: ['Revoke compromised credentials and rotate access keys.'],
          recovery: ['Restore server baseline from verified backup and monitor egress traffic.'],
        },
        forensicCommands: Array.isArray(parsed.forensicCommands) ? parsed.forensicCommands : [],
        hardeningRecommendations: Array.isArray(parsed.hardeningRecommendations) ? parsed.hardeningRecommendations : [],
        confidence: Number(parsed.confidence) || 88,
        modelUsed: model,
        analyzedAt: new Date().toISOString(),
      };
    }

    // Fallback if parsing fails
    return {
      summary: text.slice(0, 300),
      threatScore: 65,
      severity: 'high',
      rootCauseAnalysis: text,
      mitreAttack: [{ tactic: 'Defense Evasion', technique: 'Suspicious Activity', id: 'T1036', description: 'Flagged by ThreatX AI' }],
      impactAssessment: 'Detailed in AI narrative response.',
      immediateActions: ['Review raw AI narrative analysis', 'Verify source host activity'],
      playbook: {
        containment: ['Inspect traffic originating from source'],
        eradication: ['Terminate unauthorized active connections'],
        recovery: ['Audit privileged accounts'],
      },
      forensicCommands: [{ platform: 'linux', command: 'journalctl -u ssh -n 50', purpose: 'Check auth logs' }],
      hardeningRecommendations: ['Enforce multi-factor authentication (MFA)', 'Restrict SSH access by IP allowlist'],
      confidence: 80,
      modelUsed: model,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * SOC Analyst Copilot Chat Assistant
   */
  public async copilotChat(message: string, context?: any, chatHistory: any[] = []): Promise<GeminiChatResponse> {
    const systemPrompt = `You are ThreatX SOC Copilot, an elite AI cybersecurity assistant and threat hunting co-pilot.
You assist SOC analysts, security engineers, and incident responders with:
- Live threat triage and indicator analysis (IPs, Hashes, Domains, CVEs)
- Incident response playbooks & containment strategies
- Writing exact detection rules (YARA, Sigma, Snort/Suricata, Splunk SPL, KQL)
- Explaining attack techniques, MITRE ATT&CK mappings, and adversary tradecraft
- Guiding step-by-step forensic investigations.

Keep your answers structured, actionable, and formatted in clear Markdown with code snippets where helpful.`;

    let formattedHistory = '';
    if (chatHistory && chatHistory.length > 0) {
      formattedHistory = chatHistory
        .slice(-6)
        .map((h) => `${h.role === 'user' ? 'Analyst' : 'Copilot'}: ${h.content}`)
        .join('\n\n');
    }

    const userPrompt = `${context ? `[CURRENT SOC CONTEXT]:\n${JSON.stringify(context, null, 2)}\n\n` : ''}${
      formattedHistory ? `[CONVERSATION HISTORY]:\n${formattedHistory}\n\n` : ''
    }[ANALYST QUERY]: ${message}`;

    const { text, model } = await this.generateContent(userPrompt, systemPrompt, 0.3);

    // Generate 3 contextual follow-up suggestions
    const suggestions: string[] = [
      'Generate an immediate containment playbook',
      'What MITRE ATT&CK techniques apply here?',
      'Draft a forensic investigation command checklist',
    ];

    return {
      reply: text,
      suggestions,
      modelUsed: model,
    };
  }

  /**
   * Automated SOC Executive & Incident Report Generation
   */
  public async generateExecutiveReport(incidentData: any): Promise<GeminiReportResponse> {
    const systemPrompt = `You are ThreatX Chief Information Security Officer (CISO) Advisor and Lead Forensics Auditor.
Generate an extensive, professional, audit-ready Cyber Incident Investigation & Executive Threat Report in GitHub Markdown format.
Include:
1. Executive Summary & Business Impact Overview
2. Attack Timeline & Chronology of Events
3. Threat Actor Profile & MITRE ATT&CK Matrix Mapping
4. Affected Assets, Impacted User Accounts & Server Hardware Telemetry
5. Indicator of Compromise (IOC) Analysis (including AbuseIPDB & VirusTotal threat data)
6. Containment & Remediation Actions Undertaken
7. Forensic Evidence & Root Cause Determination
8. Long-Term Strategic Hardening & Compliance Recommendations (NIST CSF / ISO 27001).`;

    const userPrompt = `Generate a full-length incident report based on this SOC incident and telemetry data:
${JSON.stringify(incidentData, null, 2)}`;

    const { text, model } = await this.generateContent(userPrompt, systemPrompt, 0.2);

    const titleMatch = text.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : `ThreatX Incident Report: ${incidentData?.title || 'Security Incident'}`;

    return {
      title,
      summary: `Automated audit-grade security report compiled by ThreatX AI Sentinel (${model}).`,
      riskLevel: incidentData?.severity || incidentData?.riskLevel?.toLowerCase() || 'high',
      markdownReport: text,
      generatedAt: new Date().toISOString(),
      modelUsed: model,
    };
  }
}

export const geminiService = new GeminiService();
export default geminiService;
