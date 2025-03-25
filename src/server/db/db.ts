import { join } from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Database } from '../types/db.types';
import logger from '../config/logger';
import fs from 'fs';

// Define the database file path
const DB_PATH = process.env.DB_PATH || './data';

// Ensure the data directory exists
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
  logger.info(`Created database directory at ${DB_PATH}`);
}

// Initialize default data
const defaultData: Database = {
  users: [],
  companies: [],
  accessTokens: [],
  departments: [],
  employees: []
};

// Create the database adapter
const adapter = new JSONFile<Database>(join(DB_PATH, 'db.json'));
const db = new Low<Database>(adapter, defaultData);

// Initialize the database
const initDb = async (): Promise<Low<Database>> => {
  try {
    // Read data from JSON file
    await db.read();
    
    // If the file doesn't exist yet or is empty, write default data
    if (!db.data) {
      db.data = defaultData;
      await db.write();
      logger.info('Initialized empty database with default schema');
    }
    
    return db;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

export { db, initDb };