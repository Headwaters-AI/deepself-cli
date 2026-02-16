/**
 * Custom error classes for the Deepself CLI
 * Each error type has a specific exit code for proper shell integration
 */

/**
 * Base error class for all CLI errors
 */
export class CLIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error - exit code 3
 * Thrown when user is not authenticated or API key is invalid
 */
export class AuthenticationError extends CLIError {
  exitCode = 3;
}

/**
 * Not found error - exit code 4
 * Thrown when a resource (model, room, etc.) is not found
 */
export class NotFoundError extends CLIError {
  exitCode = 4;
}

/**
 * Usage error - exit code 2
 * Thrown when command is used incorrectly (invalid arguments, etc.)
 */
export class UsageError extends CLIError {
  exitCode = 2;
}

/**
 * API error - exit code 1
 * Generic error for API failures
 */
export class ApiError extends CLIError {
  exitCode = 1;

  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
  }
}
