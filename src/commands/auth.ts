/**
 * Authentication commands: login, logout, config
 */

import { Command } from 'commander';
import { BaseCommand, addGlobalOptions, GlobalOptions } from './base.js';
import { updateConfig, deleteConfig, getFullConfig } from '../config/manager.js';
import { ApiClient } from '../api/client.js';
import { API_ENDPOINTS } from '../api/endpoints.js';
import { ModelsListResponse } from '../api/types.js';
import { promptPassword } from '../utils/prompts.js';
import { success, labeled, info } from '../utils/output.js';
import { AuthenticationError } from '../utils/errors.js';

/**
 * Login command - authenticate with API key
 */
class LoginCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('auth.login', options);
  }

  async execute(apiKeyArg?: string): Promise<void> {
    let apiKey = apiKeyArg;

    // If no API key provided as argument, prompt for it
    if (!apiKey) {
      apiKey = await promptPassword('Enter your Deepself API key:');
    }

    if (!apiKey || apiKey.trim() === '') {
      throw new AuthenticationError('API key is required');
    }

    // Validate API key by making a test request
    try {
      const client = new ApiClient({ apiKey, baseURL: process.env.DEEPSELF_API_BASE_URL });
      await client.get<ModelsListResponse>(API_ENDPOINTS.MODELS_LIST);
    } catch (error) {
      throw new AuthenticationError(
        'Invalid API key. Please check your key and try again.'
      );
    }

    // Save API key and base URL to config
    updateConfig({
      apiKey,
      baseURL: process.env.DEEPSELF_API_BASE_URL
    });

    this.output({ success: true });
  }

  protected humanOutput(_data: any): void {
    success('Successfully authenticated!');
    info('Your API key has been saved to ~/.deepself/config.json');
  }
}

/**
 * Logout command - remove authentication
 */
class LogoutCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('auth.logout', options);
  }

  async execute(): Promise<void> {
    await deleteConfig();
    this.output({ success: true });
  }

  protected humanOutput(_data: any): void {
    success('Successfully logged out');
    info('Your API key has been removed from ~/.deepself/config.json');
  }
}

/**
 * Config command - display current configuration
 */
class ConfigCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('auth.config', options);
  }

  async execute(): Promise<void> {
    const config = getFullConfig();

    // Mask API key for security
    const maskedApiKey = config.apiKey
      ? `${config.apiKey.substring(0, 8)}...${config.apiKey.substring(config.apiKey.length - 4)}`
      : '<not set>';

    const output = {
      apiKey: config.apiKey ? maskedApiKey : undefined,
      baseURL: config.baseURL || '<using default>',
      authenticated: !!config.apiKey,
    };

    this.output(output);
  }

  protected humanOutput(data: any): void {
    labeled('API Key', data.apiKey || '<not set>');
    labeled('Base URL', data.baseURL);
    labeled('Authenticated', data.authenticated ? 'Yes' : 'No');

    if (!data.authenticated) {
      console.log();
      info('Run "deepself login" to authenticate');
    }
  }
}

/**
 * Register authentication commands
 */
export function registerAuthCommands(program: Command): void {
  // Login command
  const loginCmd = program
    .command('login')
    .description('Authenticate with your Deepself API key')
    .argument('[api-key]', 'Your API key (or will prompt if not provided)')
    .action(async (apiKey, options) => {
      const cmd = new LoginCommand(options);
      await cmd.execute(apiKey);
    });
  addGlobalOptions(loginCmd);

  // Logout command
  const logoutCmd = program
    .command('logout')
    .description('Remove stored authentication')
    .action(async (options) => {
      const cmd = new LogoutCommand(options);
      await cmd.execute();
    });
  addGlobalOptions(logoutCmd);

  // Config command
  const configCmd = program
    .command('config')
    .description('Display current configuration')
    .action(async (options) => {
      const cmd = new ConfigCommand(options);
      await cmd.execute();
    });
  addGlobalOptions(configCmd);
}
