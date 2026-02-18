/**
 * Base command class with common functionality
 */

import { Command } from 'commander';
import { ApiClient } from '../api/client.js';
import { getApiKey, getBaseURL, isAuthenticated } from '../config/manager.js';
import { AuthenticationError } from '../utils/errors.js';
import { outputJson, outputJsonError } from '../utils/output.js';

export interface GlobalOptions {
  json?: boolean;
  quiet?: boolean;
}

/**
 * Abstract base class for all CLI commands
 */
export abstract class BaseCommand {
  protected commandName: string;
  protected options: GlobalOptions;

  constructor(commandName: string, options: GlobalOptions = {}) {
    this.commandName = commandName;
    this.options = options;
  }

  /**
   * Require authentication and return API client
   * Throws AuthenticationError if not authenticated
   */
  protected requireAuth(): ApiClient {
    if (!isAuthenticated()) {
      throw new AuthenticationError(
        'Not authenticated. Run: deepself login'
      );
    }

    const apiKey = getApiKey();
    const baseURL = getBaseURL();

    return new ApiClient({
      apiKey,
      baseURL,
    });
  }

  /**
   * Get API client without requiring authentication
   * For public endpoints
   */
  protected getClient(): ApiClient {
    const apiKey = isAuthenticated() ? getApiKey() : undefined;
    const baseURL = getBaseURL();

    return new ApiClient({
      apiKey,
      baseURL,
    });
  }

  /**
   * Output data in JSON or human-readable format
   */
  protected output(data: any): void {
    if (this.options.json) {
      outputJson(this.commandName, data);
    } else if (!this.options.quiet) {
      this.humanOutput(data);
    }
  }

  /**
   * Output error in JSON or human-readable format
   */
  protected outputError(error: Error, code: string = 'ERROR'): void {
    if (this.options.json) {
      outputJsonError(this.commandName, error, code);
    } else {
      // Human error output is handled by global error handler
      throw error;
    }
  }

  /**
   * Format output for human consumption
   * Must be implemented by subclasses
   */
  protected abstract humanOutput(data: any): void;
}

/**
 * Add global options to a command
 */
export function addGlobalOptions(command: Command): Command {
  return command
    .option('--json', 'Output in JSON format')
    .option('--quiet', 'Suppress output (except errors)');
}
