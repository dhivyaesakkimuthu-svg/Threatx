import mongoose from 'mongoose';

let isConnected = false;

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function connectMongo(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/theadx';
  try {
    console.log(`[MongoDB] Attempting to connect to ${uri}...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick fallback if local MongoDB is not running
    });
    isConnected = true;
    console.log('[MongoDB] Connected successfully to database');
    return true;
  } catch (err: any) {
    isConnected = false;
    console.warn(`[MongoDB] Connection failed (${err.message}). Falling back safely to JSON file storage.`);
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
