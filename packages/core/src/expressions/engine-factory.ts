import {
  ExpressionEngine,
  ExpressionLanguage,
} from '../types/expression-types';
import { CelExpressionEngine } from './cel-engine';
import { LiquidExpressionEngine } from './liquid-engine';

// Cache instances to avoid re-creating them for every flow.
const engineInstances: {
  cel?: CelExpressionEngine;
  liquid?: LiquidExpressionEngine;
} = {};

/**
 * Factory function to create and retrieve an instance of an ExpressionEngine.
 * It caches engine instances to ensure they are singletons, which is important for performance
 * (e.g., to maintain the compiled expression cache in CelExpressionEngine).
 *
 * @param language - The expression language required ('cel' or 'liquid'). Defaults to 'cel'.
 * @returns An instance of the requested ExpressionEngine.
 */
export function createExpressionEngine(
  language: ExpressionLanguage = 'cel'
): ExpressionEngine {
  switch (language) {
    case 'liquid':
      if (!engineInstances.liquid) {
        engineInstances.liquid = new LiquidExpressionEngine();
      }
      return engineInstances.liquid;

    case 'cel':
    default:
      if (!engineInstances.cel) {
        engineInstances.cel = new CelExpressionEngine();
      }
      return engineInstances.cel;
  }
}
