/**
 * Comprehensive error handling utilities for ZFlo
 */

export interface ZFloError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  cause?: Error;
}

export class ZFloErrorHandler {
  private enableLogging: boolean;

  constructor(enableLogging = false) {
    this.enableLogging = enableLogging;
  }

  /**
   * Create a standardized ZFlo error
   */
  createError(
    code: string,
    message: string,
    context?: Record<string, unknown>,
    cause?: Error
  ): ZFloError {
    return {
      code,
      message,
      context,
      cause,
    };
  }

  /**
   * Handle and log errors consistently
   */
  handleError(error: unknown, context?: Record<string, unknown>): ZFloError {
    let ZFloError: ZFloError;

    if (this.isZFloError(error)) {
      ZFloError = error;
    } else if (error instanceof Error) {
      ZFloError = this.createError(
        'UNKNOWN_ERROR',
        error.message,
        context,
        error
      );
    } else {
      ZFloError = this.createError('UNKNOWN_ERROR', String(error), context);
    }

    if (this.enableLogging) {
      console.error('ZFlo Error:', ZFloError);
    }

    return ZFloError;
  }

  /**
   * Safe execution wrapper with error handling
   */
  async safeExecute<T>(
    operation: () => Promise<T>,
    fallback: T,
    context?: Record<string, unknown>
  ): Promise<{ success: boolean; result: T; error?: ZFloError }> {
    try {
      const result = await operation();
      return { success: true, result };
    } catch (error) {
      const ZFloError = this.handleError(error, context);
      return { success: false, result: fallback, error: ZFloError };
    }
  }

  /**
   * Safe synchronous execution wrapper
   */
  safeExecuteSync<T>(
    operation: () => T,
    fallback: T,
    context?: Record<string, unknown>
  ): { success: boolean; result: T; error?: ZFloError } {
    try {
      const result = operation();
      return { success: true, result };
    } catch (error) {
      const ZFloError = this.handleError(error, context);
      return { success: false, result: fallback, error: ZFloError };
    }
  }

  /**
   * Validate if an object is an ZFlo error
   */
  private isZFloError(obj: unknown): obj is ZFloError {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'code' in obj &&
      'message' in obj
    );
  }
}

/**
 * Common error codes used throughout ZFlo
 */
export const ErrorCodes = {
  // Flow execution errors
  NODE_NOT_FOUND: 'NODE_NOT_FOUND',
  PATH_NOT_FOUND: 'PATH_NOT_FOUND',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  CONDITION_EVALUATION_FAILED: 'CONDITION_EVALUATION_FAILED',

  // State management errors
  STATE_ACTION_FAILED: 'STATE_ACTION_FAILED',
  INVALID_STATE_VALUE: 'INVALID_STATE_VALUE',

  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_FLOW: 'INVALID_FLOW',

  // Expression evaluation errors
  EXPRESSION_COMPILATION_FAILED: 'EXPRESSION_COMPILATION_FAILED',
  EXPRESSION_EVALUATION_FAILED: 'EXPRESSION_EVALUATION_FAILED',
  UNSUPPORTED_EXPRESSION_LANGUAGE: 'UNSUPPORTED_EXPRESSION_LANGUAGE',

  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  OPERATION_TIMEOUT: 'OPERATION_TIMEOUT',
} as const;

/**
 * Global error handler instance
 */
export const globalErrorHandler = new ZFloErrorHandler();

/**
 * Utility functions for common error scenarios
 */
export function createNodeNotFoundError(nodeId: string): ZFloError {
  return globalErrorHandler.createError(
    ErrorCodes.NODE_NOT_FOUND,
    `Node not found: ${nodeId}`,
    { nodeId }
  );
}

export function createConditionEvaluationError(
  condition: string,
  cause?: Error
): ZFloError {
  return globalErrorHandler.createError(
    ErrorCodes.CONDITION_EVALUATION_FAILED,
    `Failed to evaluate condition: ${condition}`,
    { condition },
    cause
  );
}

export function createStateActionError(
  action: string,
  cause?: Error
): ZFloError {
  return globalErrorHandler.createError(
    ErrorCodes.STATE_ACTION_FAILED,
    `Failed to execute state action: ${action}`,
    { action },
    cause
  );
}
