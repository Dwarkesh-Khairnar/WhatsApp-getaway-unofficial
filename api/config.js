import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import pg from 'pg';
import { Redis } from 'ioredis';

dotenv.config();

export const config = {
  apiKey: process.env.API_KEY || 'default-super-secret-key',
  webhookSecret: process.env.WEBHOOK_SECRET || 'webhook-signing-secret',
  dbProvider: process.env.DB_PROVIDER || 'sqlite', // 'sqlite' or 'postgres'
  redisUrl: process.env.REDIS_URL || null,
};

// Initialize Database Connection
let dbInstance;
if (config.dbProvider === 'postgres') {
  dbInstance = new pg.Pool({ connectionString: process.env.DATABASE_URL });
} else {
  dbInstance = new sqlite3.Database(process.env.SQLITE_PATH || './gateway.db');
  // Create tables if using SQLite
  dbInstance.serialize(() => {
    dbInstance.run(`CREATE TABLE IF NOT EXISTS logs (id TEXT, event TEXT, timestamp TEXT, details TEXT)`);
    dbInstance.run(`CREATE TABLE IF NOT EXISTS api_keys (key TEXT, description TEXT, allowed_ips TEXT)`);
  });
}

export const db = dbInstance;
export const redis = config.redisUrl ? new Redis(config.redisUrl) : null;