/**
 * Formatting utilities for dates, keys, epsilons, etc.
 */

/**
 * Format Unix timestamp to human-readable date
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Mask API key for display (show first 8 and last 4 characters)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) {
    return '***';
  }
  return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
}

/**
 * Format epsilons object as a readable string
 * Handles both simple string values and complex epsilon objects
 */
export function formatFacts(facts: Record<string, any>): string {
  if (!facts || Object.keys(facts).length === 0) {
    return '<none>';
  }

  return Object.entries(facts)
    .map(([key, value]) => {
      // Handle complex fact objects with {value, status, identification}
      if (typeof value === 'object' && value !== null && 'value' in value) {
        return `${key}: ${value.value}`;
      }
      // Handle simple string values
      return `${key}: ${value}`;
    })
    .join(', ');
}

/**
 * Format tools array as a readable string
 */
export function formatTools(tools: string[]): string {
  if (!tools || tools.length === 0) {
    return '<none>';
  }
  return tools.join(', ');
}

/**
 * Parse fact string in format "key:value"
 */
export function parseFact(factString: string): { key: string; value: string } {
  const colonIndex = factString.indexOf(':');
  if (colonIndex === -1) {
    throw new Error(`Invalid fact format: "${factString}". Expected format: "key:value"`);
  }

  const key = factString.substring(0, colonIndex).trim();
  const value = factString.substring(colonIndex + 1).trim();

  if (!key || !value) {
    throw new Error(`Invalid fact format: "${factString}". Both key and value are required.`);
  }

  return { key, value };
}

/**
 * Truncate string to specified length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}
