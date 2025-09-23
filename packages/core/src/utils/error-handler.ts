/**
 * Comprehensive error handling utilities
 */

export interface FlowError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  cause?: Error;
}

export class FlowErrorHandler {
  private enableLogging: boolean;

  constructor(enableLogging = false) {
    this.enableLogging = enableLogging;
  }

  /**
   * Create a standardized flow error
   */
  createError(
    code: string,
    message: string,
    context?: Record<string, unknown>,
    cause?: Error
  ): FlowError {
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
  handleError(error: unknown, context?: Record<string, unknown>): FlowError {
    let flowError: FlowError;

    if (this.isFlowError(error)) {
      flowError = error;
    } else if (error instanceof Error) {
      flowError = this.createError(
        'UNKNOWN_ERROR',
        error.message,
        context,
        error
      );
    } else {
      flowError = this.createError('UNKNOWN_ERROR', String(error), context);
    }

    if (this.enableLogging) {
      console.error('Flow Error:', flowError);
    }

    return flowError;
  }

  /**
   * Safe execution wrapper with error handling
   */
  async safeExecuteAsync<T>(
    operation: () => Promise<T>,
    fallback: T,
    context?: Record<string, unknown>
  ): Promise<{ success: boolean; result: T; error?: FlowError }> {
    try {
      const result = await operation();
      return { success: true, result };
    } catch (error) {
      const flowError = this.handleError(error, context);
      return { success: false, result: fallback, error: flowError };
    }
  }

  /**
   * Safe synchronous execution wrapper
   */
  safeExecute<T>(
    operation: () => T,
    fallback: T,
    context?: Record<string, unknown>
  ): { success: boolean; result: T; error?: FlowError } {
    try {
      const result = operation();
      return { success: true, result };
    } catch (error) {
      const flowError = this.handleError(error, context);
      return { success: false, result: fallback, error: flowError };
    }
  }

  /**
   * Validate if an object is a flow error
   */
  private isFlowError(obj: unknown): obj is FlowError {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'code' in obj &&
      'message' in obj
    );
  }
}

/**
 * Common error codes used throughout the flow engine
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
export const globalErrorHandler = new FlowErrorHandler();

/**
 * Utility functions for common error scenarios
 */
export function createNodeNotFoundError(nodeId: string): FlowError {
  return globalErrorHandler.createError(
    ErrorCodes.NODE_NOT_FOUND,
    `Node not found: ${nodeId}`,
    { nodeId }
  );
}

export function createConditionEvaluationError(
  condition: string,
  cause?: Error
): FlowError {
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
): FlowError {
  return globalErrorHandler.createError(
    ErrorCodes.STATE_ACTION_FAILED,
    `Failed to execute state action: ${action}`,
    { action },
    cause
  );
}
