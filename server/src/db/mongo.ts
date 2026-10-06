import mongoose from 'mongoose';

let isConnected = false;

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function connectMongo(): Promise<boolean> {
  if (process.env.USE_MONGODB !== 'true') {
    isConnected = false;
    console.log('[Storage] Using persistent JSON file storage (server/src/data/threatx.json)');
    return false;
  }
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/theadx';
  try {
    console.log(`[MongoDB] Attempting to connect to ${uri}...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    isConnected = true;
    console.log('[MongoDB] Connected successfully to database');
    return true;
  } catch (err: any) {
    isConnected = false;
    console.warn(`[MongoDB] Connection failed (${err.message}). Using persistent JSON file storage.`);
    return false;
  }
}

export async function disconnectMongo(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[MongoDB] Disconnected');
  }
}
