import dotenv from 'dotenv';
dotenv.config();

import { abuseIPDBService } from '../services/abuseIpdbService.js';
import { virusTotalService } from '../services/virusTotalService.js';
import { geminiService } from '../services/geminiService.js';

async function testIntegrations() {
  console.log('====================================================');
  console.log('🔍 TESTING THREATX API INTEGRATIONS (AbuseIPDB, VirusTotal, Gemini)');
  console.log('====================================================\n');

  console.log('1. Checking Configuration:');
  console.log(`   - AbuseIPDB Configured: ${abuseIPDBService.isConfigured() ? '✅ YES' : '❌ NO'}`);
  console.log(`   - VirusTotal Configured: ${virusTotalService.isConfigured() ? '✅ YES' : '❌ NO'}`);
  console.log(`   - Gemini AI Configured:  ${geminiService.isConfigured() ? '✅ YES' : '❌ NO'}`);

  // Test 1: AbuseIPDB
  console.log('\n2. Testing AbuseIPDB Service:');
  try {
    const abuseRes = await abuseIPDBService.checkIp('118.25.6.39');
    console.log('   ✅ AbuseIPDB Result:', {
      ip: abuseRes.ipAddress,
      country: abuseRes.countryName,
      isp: abuseRes.isp,
      score: abuseRes.abuseConfidenceScore,
      verdict: abuseRes.verdict,
      totalReports: abuseRes.totalReports,
    });
  } catch (err: any) {
    console.error('   ❌ AbuseIPDB error:', err.message);
  }

  // Test 2: VirusTotal
  console.log('\n3. Testing VirusTotal Service:');
  try {
    const vtRes = await virusTotalService.checkIp('8.8.8.8');
    console.log('   ✅ VirusTotal Result:', {
      ip: vtRes.target,
      asOwner: vtRes.asOwner,
      country: vtRes.country,
      stats: vtRes.stats,
      verdict: vtRes.verdict,
      detectionRate: vtRes.detectionRate,
    });
  } catch (err: any) {
    console.error('   ❌ VirusTotal error:', err.message);
  }

  // Test 3: Gemini AI
  console.log('\n4. Testing Gemini AI Service:');
  try {
    const geminiRes = await geminiService.generateContent('Explain what a brute-force SSH attack is in 2 concise sentences.');
    console.log('   ✅ Gemini AI Response (Model: ' + geminiRes.model + '):');
    console.log('   "' + geminiRes.text.trim() + '"');
  } catch (err: any) {
    console.error('   ❌ Gemini AI error:', err.message);
  }

  console.log('\n====================================================');
  console.log('🎉 INTEGRATION TEST RUN COMPLETE');
  console.log('====================================================');
}

testIntegrations();
