import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectMongo, disconnectMongo } from '../src/db/mongo.js';
import {
  ServerModel,
  ActivityLogModel,
  ThreatEventModel,
  IncidentModel,
  AlertModel,
  UserBehaviorProfileModel,
  UserModel,
} from '../src/db/models/index.js';
import type { Database } from '../src/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(__dirname, '..', 'data', 'threatx.json');

async function migrate() {
  console.log('--- Starting ThreatX JSON to MongoDB Migration ---');

  if (!fs.existsSync(JSON_PATH)) {
    console.error(`JSON file not found at ${JSON_PATH}`);
    process.exit(1);
  }

  const connected = await connectMongo();
  if (!connected) {
    console.error('Failed to connect to MongoDB. Check MONGODB_URI in .env');
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(JSON_PATH, 'utf-8');
    const data: Database = JSON.parse(raw);

    let serverCount = 0;
    for (const server of data.servers || []) {
      await ServerModel.findOneAndUpdate({ id: server.id }, server, { upsert: true });
      serverCount++;
    }

    let userCount = 0;
    for (const user of data.users || []) {
      await UserModel.findOneAndUpdate({ id: user.id }, user, { upsert: true });
      userCount++;
    }

    let logCount = 0;
    for (const log of data.activityLogs || []) {
      await ActivityLogModel.findOneAndUpdate({ id: log.id }, log, { upsert: true });
      logCount++;
    }

    let profileCount = 0;
    for (const profile of data.behaviorProfiles || []) {
      await UserBehaviorProfileModel.findOneAndUpdate({ userId: profile.userId }, profile, { upsert: true });
      profileCount++;
    }

    let threatCount = 0;
    for (const threat of data.threatEvents || []) {
      await ThreatEventModel.findOneAndUpdate({ id: threat.id }, threat, { upsert: true });
      threatCount++;
    }

    let incidentCount = 0;
    for (const incident of data.incidents || []) {
      await IncidentModel.findOneAndUpdate({ id: incident.id }, incident, { upsert: true });
      incidentCount++;
    }

    let alertCount = 0;
    for (const alert of data.alerts || []) {
      await AlertModel.findOneAndUpdate({ id: alert.id }, alert, { upsert: true });
      alertCount++;
    }

    console.log('\n--- Migration Completed Successfully ---');
    console.log(`Servers migrated:           ${serverCount}`);
    console.log(`Users migrated:             ${userCount}`);
    console.log(`Activity logs migrated:     ${logCount}`);
    console.log(`Behavior profiles migrated: ${profileCount}`);
    console.log(`Threat events migrated:     ${threatCount}`);
    console.log(`Incidents migrated:         ${incidentCount}`);
    console.log(`Alerts migrated:            ${alertCount}`);
  } catch (err: any) {
    console.error('Migration failed with error:', err);
  } finally {
    await disconnectMongo();
    process.exit(0);
  }
}

migrate();
