import axios from 'axios';

export interface VirusTotalStats {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  timeout?: number;
}

export interface VirusTotalEngineDetection {
  engineName: string;
  category: string;
  result: string | null;
  method?: string;
}

export interface VirusTotalIpResult {
  type: 'ip';
  target: string;
  network?: string;
  asOwner?: string;
  country?: string;
  reputation: number;
  stats: VirusTotalStats;
  detectionRate: string;
  verdict: 'clean' | 'suspicious' | 'malicious';
  topDetections: VirusTotalEngineDetection[];
  tags: string[];
  whois?: string;
  analyzedAt: string;
  cached?: boolean;
}

export interface VirusTotalDomainResult {
  type: 'domain';
  target: string;
  registrar?: string;
  creationDate?: number;
  reputation: number;
  stats: VirusTotalStats;
  detectionRate: string;
  verdict: 'clean' | 'suspicious' | 'malicious';
  topDetections: VirusTotalEngineDetection[];
  categories: Record<string, string>;
  tags: string[];
  analyzedAt: string;
  cached?: boolean;
}

export interface VirusTotalFileResult {
  type: 'file';
  target: string;
  meaningfulName?: string;
  size?: number;
  typeDescription?: string;
  suggestedThreatLabel?: string;
  popularThreatCategories?: Array<{ count: number; value: string }>;
  reputation: number;
  stats: VirusTotalStats;
  detectionRate: string;
  verdict: 'clean' | 'suspicious' | 'malicious';
  topDetections: VirusTotalEngineDetection[];
  tags: string[];
  analyzedAt: string;
  cached?: boolean;
}

class VirusTotalService {
  private cache: Map<string, { result: any; expiresAt: number }> = new Map();
  private readonly ttlMs = 60 * 60 * 1000; // 1 Hour TTL
  private readonly baseUrl = 'https://www.virustotal.com/api/v3';

  public isConfigured(): boolean {
    return Boolean(process.env.VIRUSTOTAL_API_KEY && process.env.VIRUSTOTAL_API_KEY.trim().length > 10);
  }

  private isPrivateIp(ip: string): boolean {
    if (!ip) return true;
    const cleanIp = ip.trim().toLowerCase();
    return (
      cleanIp === 'localhost' ||
      cleanIp === '127.0.0.1' ||
      cleanIp === '::1' ||
      cleanIp === '0.0.0.0' ||
      cleanIp.startsWith('10.') ||
      cleanIp.startsWith('192.168.') ||
      cleanIp.startsWith('fc00:') ||
      cleanIp.startsWith('fe80:')
    );
  }

  /**
   * Helper to format statistics into clean verdict
   */
  private computeVerdict(stats: VirusTotalStats): 'clean' | 'suspicious' | 'malicious' {
    if (stats.malicious >= 3) return 'malicious';
    if (stats.malicious > 0 || stats.suspicious >= 2) return 'suspicious';
    return 'clean';
  }

  /**
   * Check IP Address on VirusTotal v3
   */
  public async checkIp(ip: string): Promise<VirusTotalIpResult> {
    const cleanIp = (ip || '').trim();

    const cached = this.cache.get(`ip:${cleanIp}`);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.result, cached: true };
    }

    if (this.isPrivateIp(cleanIp)) {
      const privateResult: VirusTotalIpResult = {
        type: 'ip',
        target: cleanIp,
        network: 'Private RFC-1918 / Loopback',
        asOwner: 'Internal Infrastructure',
        country: 'LAN',
        reputation: 0,
        stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 },
        detectionRate: '0/0 engines (Private IP)',
        verdict: 'clean',
        topDetections: [],
        tags: ['internal', 'private-ip'],
        analyzedAt: new Date().toISOString(),
      };
      return privateResult;
    }

    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) {
      throw new Error('VirusTotal API key is not configured in server environment.');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/ip_addresses/${encodeURIComponent(cleanIp)}`, {
        headers: {
          'x-apikey': apiKey,
          Accept: 'application/json',
        },
        timeout: 18000,
      });

      const attrs = response.data?.data?.attributes || {};
      const stats: VirusTotalStats = attrs.last_analysis_stats || {
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0,
      };

      const totalScanners =
        (stats.malicious || 0) + (stats.suspicious || 0) + (stats.harmless || 0) + (stats.undetected || 0);
      const detectionRate = `${stats.malicious || 0}/${totalScanners} engines flagged as malicious`;

      const engineResults = attrs.last_analysis_results || {};
      const topDetections: VirusTotalEngineDetection[] = Object.entries(engineResults)
        .filter(([_, value]: [string, any]) => value.category === 'malicious' || value.category === 'suspicious')
        .slice(0, 15)
        .map(([engine, val]: [string, any]) => ({
          engineName: engine,
          category: val.category,
          result: val.result || 'flagged',
          method: val.method,
        }));

      const verdict = this.computeVerdict(stats);

      const result: VirusTotalIpResult = {
        type: 'ip',
        target: cleanIp,
        network: attrs.network || '',
        asOwner: attrs.as_owner || '',
        country: attrs.country || '',
        reputation: attrs.reputation || 0,
        stats,
        detectionRate,
        verdict,
        topDetections,
        tags: attrs.tags || [],
        whois: attrs.whois ? String(attrs.whois).slice(0, 1000) : undefined,
        analyzedAt: new Date().toISOString(),
      };

      this.cache.set(`ip:${cleanIp}`, {
        result,
        expiresAt: Date.now() + this.ttlMs,
      });

      return result;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.message;
      console.error(`[VirusTotal API Error] Failed checking IP ${cleanIp}:`, errorMsg);
      throw new Error(`VirusTotal IP lookup failed: ${errorMsg}`);
    }
  }

  /**
   * Check Domain on VirusTotal v3
   */
  public async checkDomain(domain: string): Promise<VirusTotalDomainResult> {
    const cleanDomain = (domain || '').trim().toLowerCase();

    const cached = this.cache.get(`domain:${cleanDomain}`);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.result, cached: true };
    }

    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) {
      throw new Error('VirusTotal API key is not configured in server environment.');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/domains/${encodeURIComponent(cleanDomain)}`, {
        headers: {
          'x-apikey': apiKey,
          Accept: 'application/json',
        },
        timeout: 18000,
      });

      const attrs = response.data?.data?.attributes || {};
      const stats: VirusTotalStats = attrs.last_analysis_stats || {
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0,
      };

      const totalScanners =
        (stats.malicious || 0) + (stats.suspicious || 0) + (stats.harmless || 0) + (stats.undetected || 0);
      const detectionRate = `${stats.malicious || 0}/${totalScanners} engines flagged as malicious`;

      const engineResults = attrs.last_analysis_results || {};
      const topDetections: VirusTotalEngineDetection[] = Object.entries(engineResults)
        .filter(([_, value]: [string, any]) => value.category === 'malicious' || value.category === 'suspicious')
        .slice(0, 15)
        .map(([engine, val]: [string, any]) => ({
          engineName: engine,
          category: val.category,
          result: val.result || 'flagged',
          method: val.method,
        }));

      const verdict = this.computeVerdict(stats);

      const result: VirusTotalDomainResult = {
        type: 'domain',
        target: cleanDomain,
        registrar: attrs.registrar || '',
        creationDate: attrs.creation_date,
        reputation: attrs.reputation || 0,
        stats,
        detectionRate,
        verdict,
        topDetections,
        categories: attrs.categories || {},
        tags: attrs.tags || [],
        analyzedAt: new Date().toISOString(),
      };

      this.cache.set(`domain:${cleanDomain}`, {
        result,
        expiresAt: Date.now() + this.ttlMs,
      });

      return result;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.message;
      console.error(`[VirusTotal API Error] Failed checking domain ${cleanDomain}:`, errorMsg);
      throw new Error(`VirusTotal domain lookup failed: ${errorMsg}`);
    }
  }

  /**
   * Check File Hash (MD5, SHA1, SHA256) on VirusTotal v3
   */
  public async checkFileHash(hash: string): Promise<VirusTotalFileResult> {
    const cleanHash = (hash || '').trim().toLowerCase();

    const cached = this.cache.get(`hash:${cleanHash}`);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.result, cached: true };
    }

    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) {
      throw new Error('VirusTotal API key is not configured in server environment.');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/files/${encodeURIComponent(cleanHash)}`, {
        headers: {
          'x-apikey': apiKey,
          Accept: 'application/json',
        },
        timeout: 18000,
      });

      const attrs = response.data?.data?.attributes || {};
      const stats: VirusTotalStats = attrs.last_analysis_stats || {
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0,
      };

      const totalScanners =
        (stats.malicious || 0) + (stats.suspicious || 0) + (stats.harmless || 0) + (stats.undetected || 0);
      const detectionRate = `${stats.malicious || 0}/${totalScanners} engines flagged as malicious`;

      const engineResults = attrs.last_analysis_results || {};
      const topDetections: VirusTotalEngineDetection[] = Object.entries(engineResults)
        .filter(([_, value]: [string, any]) => value.category === 'malicious' || value.category === 'suspicious')
        .slice(0, 15)
        .map(([engine, val]: [string, any]) => ({
          engineName: engine,
          category: val.category,
          result: val.result || 'flagged',
          method: val.method,
        }));

      const verdict = this.computeVerdict(stats);

      const threatClass = attrs.popular_threat_classification || {};

      const result: VirusTotalFileResult = {
        type: 'file',
        target: cleanHash,
        meaningfulName: attrs.meaningful_name || attrs.names?.[0] || 'Unknown File',
        size: attrs.size,
        typeDescription: attrs.type_description || '',
        suggestedThreatLabel: threatClass.suggested_threat_label,
        popularThreatCategories: threatClass.popular_threat_category || [],
        reputation: attrs.reputation || 0,
        stats,
        detectionRate,
        verdict,
        topDetections,
        tags: attrs.tags || [],
        analyzedAt: new Date().toISOString(),
      };

      this.cache.set(`hash:${cleanHash}`, {
        result,
        expiresAt: Date.now() + this.ttlMs,
      });

      return result;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.message;
      console.error(`[VirusTotal API Error] Failed checking hash ${cleanHash}:`, errorMsg);
      throw new Error(`VirusTotal file hash lookup failed: ${errorMsg}`);
    }
  }
}

export const virusTotalService = new VirusTotalService();
export default virusTotalService;
