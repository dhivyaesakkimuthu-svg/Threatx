import type { ActivityLog, UserBehaviorProfile } from '../types.js';
import { getDb, persistDb } from '../db/store.js';

export class BehaviorProfileManager {
  getOrCreate(userId: string, username: string): UserBehaviorProfile {
    const db = getDb();
    let profile = db.behaviorProfiles.find((p) => p.userId === userId || p.username.toLowerCase() === username.toLowerCase());
    if (!profile) {
      profile = {
        userId,
        username,
        knownIps: [],
        knownDevices: [],
        typicalLoginHours: [],
        typicalLocations: [],
        failedLoginCount: 0,
        accessedFiles: [],
        restrictedAccessCount: 0,
      };
      db.behaviorProfiles.push(profile);
      persistDb();
    }
    return profile;
  }

  updateFromActivity(log: ActivityLog): void {
    const db = getDb();
    const profile = this.getOrCreate(log.userId, log.username);
    const hour = new Date(log.timestamp).getHours();

    if (log.eventType === 'login' && log.success) {
      if (!profile.knownIps.includes(log.ipAddress)) {
        profile.knownIps.push(log.ipAddress);
      }
      if (!profile.knownDevices.includes(log.device)) {
        profile.knownDevices.push(log.device);
      }
      if (!profile.typicalLoginHours.includes(hour)) {
        profile.typicalLoginHours.push(hour);
      }
      if (log.location) {
        const exists = profile.typicalLocations.some(
          (l) => l.city === log.location!.city
        );
        if (!exists) {
          profile.typicalLocations.push({
            lat: log.location.lat,
            lng: log.location.lng,
            city: log.location.city,
          });
        }
      }
      profile.lastLogin = {
        ip: log.ipAddress,
        device: log.device,
        timestamp: log.timestamp,
        location: log.location
          ? { lat: log.location.lat, lng: log.location.lng }
          : undefined,
      };
      profile.failedLoginCount = 0;
    }

    if (log.eventType === 'failed_login') {
      profile.failedLoginCount += 1;
    }

    if (log.eventType === 'file_access' && log.filePath) {
      if (!profile.accessedFiles.includes(log.filePath)) {
        profile.accessedFiles.push(log.filePath);
      }
    }

    const idx = db.behaviorProfiles.findIndex((p) => p.userId === log.userId);
    if (idx >= 0) db.behaviorProfiles[idx] = profile;
    persistDb();
  }

  getProfile(userId: string): UserBehaviorProfile | undefined {
    return getDb().behaviorProfiles.find((p) => p.userId === userId);
  }
}

export const behaviorManager = new BehaviorProfileManager();
