import axios from 'axios';

export interface AbuseReport {
  reportedAt: string;
  comment: string;
  categories: number[];
  categoryNames: string[];
  reporterId: number;
  reporterCountryCode: string;
}

export interface AbuseIPDBResult {
  ipAddress: string;
  isPublic: boolean;
  ipVersion: number;
  isWhitelisted: boolean;
  abuseConfidenceScore: number; // 0 - 100
  countryCode: string;
  countryName: string;
  usageType: string;
  isp: string;
  domain: string;
  hostnames: string[];
  totalReports: number;
  numDistinctUsers: number;
  lastReportedAt: string | null;
  reports?: AbuseReport[];
  isPrivateIp?: boolean;
  verdict: 'clean' | 'suspicious' | 'malicious';
  cached?: boolean;
  analyzedAt: string;
}

const CATEGORY_MAP: Record<number, string> = {
  1: 'DNS Compromise',
  2: 'DNS Poisoning',
  3: 'Fraud Orders',
  4: 'DDoS Attack',
  5: 'FTP Brute-Force',
  6: 'Ping of Death',
  7: 'Phishing',
  8: 'Fraud VoIP',
  9: 'Open Proxy',
  10: 'Web Spam',
  11: 'Email Spam',
  12: 'Blog Spam',
  13: 'VPN IP',
  14: 'Port Scan',
  15: 'Hacking',
  16: 'SQL Injection',
  17: 'Spoofing',
  18: 'Brute-Force',
  19: 'Bad Web Bot',
  20: 'Exploited Host',
  21: 'Web App Attack',
  22: 'SSH',
  23: 'IoT Targeted',
};

class AbuseIPDBService {
  private cache: Map<string, { result: AbuseIPDBResult; expiresAt: number }> = new Map();
  private readonly ttlMs = 60 * 60 * 1000; // 1 Hour TTL

  /**
   * Helper to determine if an IP is local, loopback, or private RFC 1918
   */
  public isPrivateIp(ip: string): boolean {
    if (!ip) return true;
    const cleanIp = ip.trim().toLowerCase();
    if (
      cleanIp === 'localhost' ||
      cleanIp === '127.0.0.1' ||
      cleanIp === '::1' ||
      cleanIp === '0.0.0.0' ||
      cleanIp.startsWith('10.') ||
      cleanIp.startsWith('192.168.') ||
      cleanIp.startsWith('fc00:') ||
      cleanIp.startsWith('fe80:')
    ) {
      return true;
    }
    // 172.16.0.0 to 172.31.255.255
    if (cleanIp.startsWith('172.')) {
      const parts = cleanIp.split('.');
      if (parts.length >= 2) {
        const secondOctet = parseInt(parts[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Checks if AbuseIPDB API Key is configured
   */
  public isConfigured(): boolean {
    return Boolean(process.env.ABUSEIPDB_API_KEY && process.env.ABUSEIPDB_API_KEY.trim().length > 10);
  }

  /**
   * Query AbuseIPDB check endpoint for reputation score, ISP, and report history
   */
  public async checkIp(ip: string, maxAgeInDays = 90): Promise<AbuseIPDBResult> {
    const cleanIp = (ip || '').trim();

    // Check cache
    const cached = this.cache.get(cleanIp);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.result, cached: true };
    }

    // Handle Private / Internal IPs
    if (this.isPrivateIp(cleanIp)) {
      const privateResult: AbuseIPDBResult = {
        ipAddress: cleanIp,
        isPublic: false,
        ipVersion: cleanIp.includes(':') ? 6 : 4,
        isWhitelisted: true,
        abuseConfidenceScore: 0,
        countryCode: 'LAN',
        countryName: 'Private / Internal Network',
        usageType: 'Internal Network / Private RFC-1918',
        isp: 'Internal Subnet',
        domain: 'local',
        hostnames: ['localhost'],
        totalReports: 0,
        numDistinctUsers: 0,
        lastReportedAt: null,
        reports: [],
        isPrivateIp: true,
        verdict: 'clean',
        analyzedAt: new Date().toISOString(),
      };
      return privateResult;
    }

    const apiKey = process.env.ABUSEIPDB_API_KEY;
    if (!apiKey) {
      throw new Error('AbuseIPDB API key is not configured in server environment.');
    }

    try {
      const response = await axios.get('https://api.abuseipdb.com/api/v2/check', {
        headers: {
          Key: apiKey,
          Accept: 'application/json',
        },
        params: {
          ipAddress: cleanIp,
          maxAgeInDays,
          verbose: true,
        },
        timeout: 18000,
      });

      const data = response.data?.data;
      if (!data) {
        throw new Error('Empty response received from AbuseIPDB API');
      }

      const score = Number(data.abuseConfidenceScore) || 0;
      let verdict: 'clean' | 'suspicious' | 'malicious' = 'clean';
      if (score >= 50) {
        verdict = 'malicious';
      } else if (score >= 20 || data.totalReports > 0) {
        verdict = 'suspicious';
      }

      const formattedReports: AbuseReport[] = Array.isArray(data.reports)
        ? data.reports.slice(0, 10).map((r: any) => ({
            reportedAt: r.reportedAt,
            comment: r.comment,
            categories: r.categories || [],
            categoryNames: (r.categories || []).map((catId: number) => CATEGORY_MAP[catId] || `Category ${catId}`),
            reporterId: r.reporterId,
            reporterCountryCode: r.reporterCountryCode,
          }))
        : [];

      const result: AbuseIPDBResult = {
        ipAddress: data.ipAddress || cleanIp,
        isPublic: data.isPublic ?? true,
        ipVersion: data.ipVersion || 4,
        isWhitelisted: Boolean(data.isWhitelisted),
        abuseConfidenceScore: score,
        countryCode: data.countryCode || 'Unknown',
        countryName: data.countryName || 'Unknown',
        usageType: data.usageType || 'Unknown',
        isp: data.isp || 'Unknown ISP',
        domain: data.domain || '',
        hostnames: data.hostnames || [],
        totalReports: data.totalReports || 0,
        numDistinctUsers: data.numDistinctUsers || 0,
        lastReportedAt: data.lastReportedAt || null,
        reports: formattedReports,
        isPrivateIp: false,
        verdict,
        analyzedAt: new Date().toISOString(),
      };

      // Cache result
      this.cache.set(cleanIp, {
        result,
        expiresAt: Date.now() + this.ttlMs,
      });

      return result;
    } catch (err: any) {
      const errorMsg = err.response?.data?.errors?.[0]?.detail || err.message;
      console.error(`[AbuseIPDB API Error] Failed checking IP ${cleanIp}:`, errorMsg);
      throw new Error(`AbuseIPDB lookup failed: ${errorMsg}`);
    }
  }
}

export const abuseIPDBService = new AbuseIPDBService();
export default abuseIPDBService;
