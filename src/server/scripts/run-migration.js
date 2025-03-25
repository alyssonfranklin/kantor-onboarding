#!/usr/bin/env node

require('dotenv').config();
const { execSync } = require('child_process');

try {
  console.log('Starting migration from Google Sheets to JSON database...');
  execSync('node --require ts-node/register src/server/scripts/migrate-from-sheets.ts', {
    stdio: 'inherit'
  });
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}