//

import { StateManager } from '../core/state-manager';
import { PathSegment, PathTestResult } from '../types/analysis-types';
import { FlowDefinition, OutletDefinition } from '../types/flow-types';

export class PathTester {
  private flow: FlowDefinition;
  private stateManager: StateManager<Record<string, unknown>>;

  constructor(flow: FlowDefinition) {
    this.flow = flow;
    this.stateManager = new StateManager(
      this.flow.initialState ?? {},
      this.flow.afterStateChangeRules ?? [],
      {
        expressionLanguage: this.flow.expressionLanguage,
        stateSchema: this.flow.stateSchema,
        validateOnChange: false,
      }
    );
  }

  async test(path: PathSegment[]): Promise<PathTestResult> {
    await this.stateManager.reset(this.flow.initialState);

    const errors: { segment: PathSegment; error: string }[] = [];

    for (const segment of path) {
      if (segment.type === 'choice') {
        const outlet = segment.outletId
          ? this.findOutlet(segment.outletId)
          : null;
        if (!outlet) {
          errors.push({
            segment,
            error: `Outlet ${segment.outletId} not found`,
          });
          break;
        }
        if (outlet.condition) {
          const conditionResult = await this.stateManager.evaluateCondition(
            outlet.condition
          );
          if (!conditionResult) {
            errors.push({
              segment,
              error: `Condition not met for ${segment.outletId}`,
            });
            break;
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      finalState: this.stateManager.getState(),
      errors,
    };
  }

  private findOutlet(outletId: string): OutletDefinition | null {
    for (const node of this.flow.nodes) {
      if (node.outlets) {
        const outlet = node.outlets.find((o) => o.id === outletId);
        if (outlet) return outlet;
      }
    }
    return null;
  }
}
