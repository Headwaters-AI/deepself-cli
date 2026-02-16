/**
 * Configuration file management for Deepself CLI
 * Handles ~/.deepself/config.json with secure permissions
 */

import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { unlink } from 'fs/promises';

export interface Config {
  apiKey?: string;
  baseURL?: string;
}

const CONFIG_DIR = join(homedir(), '.deepself');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Get the effective API key from config file or environment
 * Precedence: ENV > config file
 */
export function getApiKey(): string | undefined {
  // Check environment first
  const envKey = process.env.DEEPSELF_API_KEY;
  if (envKey) {
    return envKey;
  }

  // Check config file
  const config = loadConfig();
  return config.apiKey;
}

/**
 * Get the effective base URL from config file or environment
 * Precedence: ENV > config file > default (handled by API client)
 */
export function getBaseURL(): string | undefined {
  // Check environment first
  const envURL = process.env.DEEPSELF_API_BASE_URL;
  if (envURL) {
    return envURL;
  }

  // Check config file
  const config = loadConfig();
  return config.baseURL;
}

/**
 * Load configuration from file
 * Returns empty config if file doesn't exist
 */
export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as Config;
  } catch (error) {
    // If config file is corrupted, return empty config
    console.warn(`Warning: Could not parse config file: ${error}`);
    return {};
  }
}

/**
 * Save configuration to file with secure permissions
 */
export function saveConfig(config: Config): void {
  // Create config directory if it doesn't exist
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }

  // Write config file
  const content = JSON.stringify(config, null, 2);
  writeFileSync(CONFIG_FILE, content, { encoding: 'utf-8', mode: 0o600 });

  // Ensure secure permissions (0600 = rw-------)
  // This is important for protecting the API key
  try {
    chmodSync(CONFIG_FILE, 0o600);
  } catch (error) {
    console.warn(`Warning: Could not set secure permissions on config file: ${error}`);
  }
}

/**
 * Update configuration (merge with existing)
 */
export function updateConfig(updates: Partial<Config>): void {
  const config = loadConfig();
  const newConfig = { ...config, ...updates };
  saveConfig(newConfig);
}

/**
 * Delete configuration file
 */
export async function deleteConfig(): Promise<void> {
  if (existsSync(CONFIG_FILE)) {
    await unlink(CONFIG_FILE);
  }
}

/**
 * Check if user is authenticated (has API key)
 */
export function isAuthenticated(): boolean {
  const apiKey = getApiKey();
  return !!apiKey;
}

/**
 * Get full config including environment variables
 */
export function getFullConfig(): Config {
  return {
    apiKey: getApiKey(),
    baseURL: getBaseURL(),
  };
}
