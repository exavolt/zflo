import { FlowDefinition } from '../types/flow-types';
import { ValidationResult } from '../types/analysis-types';

export async function validateFlow(
  _flow: FlowDefinition
): Promise<ValidationResult> {
  throw new Error('Not implemented');
}
