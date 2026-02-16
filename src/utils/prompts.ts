/**
 * Interactive prompt utilities with --no-interactive support
 */

import inquirer from 'inquirer';
import { UsageError } from './errors.js';

/**
 * Check if running in non-interactive mode
 */
export function isNonInteractive(): boolean {
  return (
    process.env.CI === 'true' ||
    !process.stdin.isTTY ||
    process.argv.includes('--no-interactive')
  );
}

/**
 * Prompt for text input
 */
export async function promptText(
  message: string,
  defaultValue?: string
): Promise<string> {
  if (isNonInteractive()) {
    if (defaultValue) {
      return defaultValue;
    }
    throw new UsageError(
      `Interactive input required but running in non-interactive mode. Use --no-interactive flag with all required options.`
    );
  }

  const { value } = await inquirer.prompt([
    {
      type: 'input',
      name: 'value',
      message,
      default: defaultValue,
    },
  ]);

  return value;
}

/**
 * Prompt for password (masked input)
 */
export async function promptPassword(message: string): Promise<string> {
  if (isNonInteractive()) {
    throw new UsageError(
      `Password input required but running in non-interactive mode.`
    );
  }

  const { value } = await inquirer.prompt([
    {
      type: 'password',
      name: 'value',
      message,
      mask: '*',
    },
  ]);

  return value;
}

/**
 * Prompt for confirmation (yes/no)
 */
export async function promptConfirm(
  message: string,
  defaultValue: boolean = false
): Promise<boolean> {
  if (isNonInteractive()) {
    return defaultValue;
  }

  const { value } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'value',
      message,
      default: defaultValue,
    },
  ]);

  return value;
}

/**
 * Prompt for selection from a list
 */
export async function promptSelect<T extends string>(
  message: string,
  choices: T[],
  defaultValue?: T
): Promise<T> {
  if (isNonInteractive()) {
    if (defaultValue) {
      return defaultValue;
    }
    throw new UsageError(
      `Selection required but running in non-interactive mode.`
    );
  }

  const { value } = await inquirer.prompt([
    {
      type: 'list',
      name: 'value',
      message,
      choices,
      default: defaultValue,
    },
  ]);

  return value;
}
