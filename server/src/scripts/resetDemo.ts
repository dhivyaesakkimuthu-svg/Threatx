/**
 * ThreatX Safe Demo Data Reset Script
 * Resets development demo data back to clean deterministic baseline.
 * Protected against accidentally wiping non-development targets.
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import { seedDemoData } from '../seed.js';
import {
  ThreatModel,
  AlertModel,
  ActivityModel,
  SessionModel,
  ServerModel,
  IntelligenceDecisionModel,
  ReportModel,
} from '../models/index.js';

async function runReset() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/threatx_db';

  // Safety check: Never run reset against production database names unless explicitly allowed
  if (uri.includes('prod') && process.env.ALLOW_PROD_RESET !== 'true') {
    console.error('[FATAL] Cannot reset production database without ALLOW_PROD_RESET=true.');
    process.exit(1);
  }

  console.log('[ThreatX Reset] Connecting to MongoDB...');
  await connectDB();

  if (isDbConnected()) {
    console.log('[ThreatX Reset] Clearing dynamic development events...');
    await ThreatModel.deleteMany({});
    await AlertModel.deleteMany({});
    await ActivityModel.deleteMany({});
    await IntelligenceDecisionModel.deleteMany({});
    await ServerModel.deleteMany({});
    await SessionModel.deleteMany({});
    await ReportModel.deleteMany({});

    console.log('[ThreatX Reset] Re-seeding deterministic baseline data...');
    await seedDemoData();
    console.log('[ThreatX Reset] Successfully restored clean demo baseline.');
  } else {
    console.log('[ThreatX Reset] MongoDB not reachable; resetting in-memory/file store.');
    await seedDemoData();
  }

  await mongoose.connection.close();
  process.exit(0);
}

runReset().catch((err) => {
  console.error('[ThreatX Reset Error]', err);
  process.exit(1);
});
