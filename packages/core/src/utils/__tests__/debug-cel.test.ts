import { describe, it } from 'vitest';
import { CelEvaluator } from '../../core/cel-evaluator';

describe('CEL Debug', () => {
  it('should show what CEL returns for undefined variables', () => {
    const evaluator = new CelEvaluator();
    const result = evaluator.evaluate('unknownVar', {});

    console.log('CEL result for unknownVar:', result);
    console.log('Type:', typeof result);
    console.log('Is undefined:', result === undefined);
    console.log('Is null:', result === null);
  });
});
