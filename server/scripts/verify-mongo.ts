import 'dotenv/config';
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

async function verify() {
  const connected = await connectMongo();
  if (!connected) {
    console.error('Failed to connect to MongoDB');
    return;
  }

  try {
    const [servers, activityLogs, behaviorProfiles, threatEvents, incidents, alerts, users] =
      await Promise.all([
        ServerModel.countDocuments(),
        ActivityLogModel.countDocuments(),
        UserBehaviorProfileModel.countDocuments(),
        ThreatEventModel.countDocuments(),
        IncidentModel.countDocuments(),
        AlertModel.countDocuments(),
        UserModel.countDocuments(),
      ]);

    console.log('\n--- Collections & Document Counts ---');
    console.log(` • activitylogs            : ${activityLogs} documents`);
    console.log(` • incidents               : ${incidents} documents`);
    console.log(` • userbehaviorprofiles    : ${behaviorProfiles} documents`);
    console.log(` • threatevents            : ${threatEvents} documents`);
    console.log(` • users                   : ${users} documents`);
    console.log(` • servers                 : ${servers} documents`);
    console.log(` • alerts                  : ${alerts} documents`);
    console.log('-------------------------------------\n');
  } catch (err) {
    console.error('Error querying collections:', err);
  } finally {
    await disconnectMongo();
  }
}

verify();
