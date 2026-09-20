import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { seedDatabaseIfEmpty } from '../services/seed.service.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/feature_portal';

const hasCustomUri = Boolean(process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('127.0.0.1'));

interface ConnectionState {
  isConnected?: number;
}

const connection: ConnectionState = {};

// Set security-first Mongoose options and disable command buffering when disconnected
mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true);
mongoose.set('bufferCommands', false);

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectDB(): Promise<typeof mongoose | null> {
  if (connection.isConnected) {
    return mongoose;
  }

  // If a custom MONGODB_URI (e.g. MongoDB Atlas) is configured, allow 10s for DNS SRV & TLS handshake.
  // If running locally without a daemon, use 2.5s to fall back immediately to in-memory store.
  try {
    const isProduction = process.env.NODE_ENV === 'production';

    const db = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 15,
      minPoolSize: 2,
      serverSelectionTimeoutMS: hasCustomUri ? 10000 : 2500,
      socketTimeoutMS: 30000,
      autoIndex: !isProduction,
      retryWrites: true,
      w: 'majority',
    });

    connection.isConnected = db.connections[0].readyState;

    // Auto-seed initial admin and demo data if fresh MongoDB instance
    await seedDatabaseIfEmpty();

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.warn('MongoDB runtime connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Switching to in-memory state fallback.');
      connection.isConnected = 0;
    });

    return mongoose;
  } catch (error: any) {
    connection.isConnected = 0;
    console.error('MongoDB connection failed:', error);
    return null;
  }
}

export async function disconnectDB(): Promise<void> {
  if (connection.isConnected) {
    await mongoose.disconnect();
    connection.isConnected = 0;
    console.log('MongoDB connection closed.');
  }
}
