/**
 * Output formatting utilities for human and JSON output
 */

import chalk from 'chalk';

/**
 * Standard JSON output format for all commands
 */
export interface JsonOutput<T = any> {
  status: 'ok' | 'error';
  command: string;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

/**
 * Format output as JSON
 */
export function outputJson<T>(command: string, data: T): void {
  const output: JsonOutput<T> = {
    status: 'ok',
    command,
    data,
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(output, null, 2));
}

/**
 * Format error as JSON
 */
export function outputJsonError(command: string, error: Error, code: string = 'ERROR'): void {
  const output: JsonOutput = {
    status: 'error',
    command,
    error: {
      code,
      message: error.message,
    },
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(output, null, 2));
}

/**
 * Format success message for human output
 */
export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

/**
 * Format error message for human output
 */
export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

/**
 * Format info message for human output
 */
export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Format warning message for human output
 */
export function warning(message: string): void {
  console.warn(chalk.yellow('⚠'), message);
}

/**
 * Print a labeled value (for config display, etc.)
 */
export function labeled(label: string, value: string): void {
  console.log(chalk.gray(`${label}:`), value);
}
