#!/usr/bin/env node

/**
 * Deepself CLI - Main entry point
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { registerAuthCommands } from './commands/auth.js';
import { registerModelsCommands } from './commands/models.js';
import { registerTrainCommands } from './commands/train.js';
import { registerChatCommands } from './commands/chat.js';
import {
  AuthenticationError,
  NotFoundError,
  UsageError,
  ApiError,
  CLIError,
} from './utils/errors.js';

// Create the CLI program
const program = new Command();

program
  .name('deepself')
  .description('Official CLI for interacting with the Deepself API')
  .version('0.1.0');

// Register command groups
registerAuthCommands(program);
registerModelsCommands(program);
registerTrainCommands(program);
registerChatCommands(program);

// Global error handler
async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    // Handle known error types with specific exit codes
    if (error instanceof AuthenticationError) {
      console.error(chalk.red('✗ Authentication Error:'), error.message);
      process.exit(error.exitCode);
    } else if (error instanceof NotFoundError) {
      console.error(chalk.red('✗ Not Found:'), error.message);
      process.exit(error.exitCode);
    } else if (error instanceof UsageError) {
      console.error(chalk.red('✗ Usage Error:'), error.message);
      process.exit(error.exitCode);
    } else if (error instanceof ApiError) {
      console.error(chalk.red('✗ API Error:'), error.message);
      if (error.statusCode) {
        console.error(chalk.gray(`Status Code: ${error.statusCode}`));
      }
      if (error.code) {
        console.error(chalk.gray(`Error Code: ${error.code}`));
      }
      process.exit(error.exitCode);
    } else if (error instanceof CLIError) {
      console.error(chalk.red('✗ Error:'), error.message);
      process.exit(1);
    } else if (error instanceof Error) {
      // Unknown error
      console.error(chalk.red('✗ Unexpected Error:'), error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
}

// Run the CLI
main();
