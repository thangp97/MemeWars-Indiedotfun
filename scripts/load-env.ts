/**
 * Load environment variables from .env file
 * Usage: import this in test files to load .env variables
 */

import * as fs from 'fs';
import * as path from 'path';

export function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  .env file not found. Using default values.');
    console.warn('   Create .env file from .env.example for custom configuration.');
    return;
  }

  const envFile = fs.readFileSync(envPath, 'utf-8');
  const lines = envFile.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (trimmedLine.startsWith('#') || trimmedLine === '') {
      continue;
    }

    // Parse KEY=VALUE
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex === -1) {
      continue;
    }

    const key = trimmedLine.substring(0, equalIndex).trim();
    const value = trimmedLine.substring(equalIndex + 1).trim();

    // Remove quotes if present
    const cleanValue = value.replace(/^["']|["']$/g, '');

    // Set environment variable if not already set
    if (!process.env[key]) {
      process.env[key] = cleanValue;
    }
  }

  console.log('✅ Environment variables loaded from .env');
}

// Auto-load if imported
if (require.main !== module) {
  loadEnv();
}

