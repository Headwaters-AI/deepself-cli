/**
 * Table formatting utilities using cli-table3
 */

import Table from 'cli-table3';
import chalk from 'chalk';

/**
 * Create a styled table with consistent formatting
 */
export function createTable(headers: string[]): Table.Table {
  return new Table({
    head: headers.map((h) => chalk.cyan(h)),
    style: {
      head: [],
      border: ['gray'],
    },
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
  });
}

/**
 * Create a simple key-value table (for single item display)
 */
export function createKeyValueTable(): Table.Table {
  return new Table({
    style: {
      head: [],
      border: ['gray'],
    },
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
  });
}
