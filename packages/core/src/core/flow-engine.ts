import { EventEmitter } from 'eventemitter3';
import { StateManager } from './state-manager';
import {
  RuntimeFlow,
  RuntimeNode,
  RuntimeChoice,
  ExecutionContext,
  ExecutionStep,
  EngineOptions,
  EngineEventData,
  IStateManager,
} from '../types/execution-types';
import {
  FlowDefinition,
  NodeDefinition,
  OutletDefinition,
} from '../types/flow-types';
import { RuntimeFlowFactory } from '../utils/runtime-flow-factory';
import { createExpressionEngine } from '../expressions/engine-factory';
import { ExpressionEngine } from '../types/expression-types';

export class FlowEngine<
  TState extends object = Record<string, unknown>,
> extends EventEmitter<EngineEventData<TState>> {
  private runtimeFlow: RuntimeFlow<TState>;
  private stateManager: IStateManager<TState>;
  private options: EngineOptions<TState>;
  private engine: ExpressionEngine;

  constructor(
    flowDefinition: FlowDefinition<TState>,
    options: EngineOptions<TState> = {}
  ) {
    super();

    this.options = { enableHistory: true, maxHistorySize: 100, ...options };
    this.engine = createExpressionEngine(flowDefinition.expressionLanguage);

    this.runtimeFlow = RuntimeFlowFactory.create(
      flowDefinition,
      options.initialState
    );

    this.stateManager = options.stateManager
      ? options.stateManager
      : new StateManager<TState>(
          this.runtimeFlow.state,
          flowDefinition.afterStateChangeRules || [],
          {
            expressionLanguage: flowDefinition.expressionLanguage,
            stateSchema: flowDefinition.stateSchema,
            validateOnChange: true,
          }
        );

    this.stateManager.on('stateChange', (data) => {
      this.runtimeFlow.state = data.newState;
      this.emit('stateChange', data);
    });

    this.stateManager.on('error', (data) => {
      if (
        data.context?.type === 'forceTransition' &&
        data.context.rule?.target
      ) {
        this.handleForcedTransition(data.context.rule.target);
      } else {
        this.emit('error', data);
      }
    });
  }

  async start(): Promise<ExecutionContext<TState>> {
    const { startNodeId } = this.runtimeFlow.definition;
    if (!this.runtimeFlow.nodeMap.has(startNodeId)) {
      throw new Error(`Start node "${startNodeId}" not found`);
    }
    return this.transitionToNode(startNodeId);
  }

  async next(choiceId?: string): Promise<ExecutionContext<TState>> {
    const { currentNodeId } = this.runtimeFlow;
    if (!currentNodeId) {
      throw new Error('No current node. Call start() first.');
    }

    const currentNode = this.getCurrentRuntimeNode();
    let targetNodeId: string | null = null;

    if (choiceId) {
      const outletResult = this.runtimeFlow.outletMap.get(choiceId);
      if (!outletResult || outletResult.fromNodeId !== currentNodeId) {
        throw new Error(`Invalid choice: ${choiceId}`);
      }
      targetNodeId = outletResult.outlet.to;
    } else {
      if (currentNode.type === 'decision') {
        targetNodeId = await this.evaluateAutomaticDecision(currentNodeId);
      } else if (currentNode.type === 'action') {
        const outlets = this.getOutlets(currentNodeId);
        if (outlets.length === 1 && outlets[0]) targetNodeId = outlets[0].to;
      }
    }

    if (currentNode.type === 'decision' && !choiceId) {
      return this.createExecutionContext();
    }

    if (!targetNodeId) throw new Error('No valid transition found');

    return this.transitionToNode(targetNodeId, choiceId);
  }

  async getCurrentContext(): Promise<ExecutionContext<TState> | null> {
    if (!this.runtimeFlow.currentNodeId) return null;
    return this.createExecutionContext();
  }

  getHistory(): ExecutionStep<TState>[] {
    return [...this.runtimeFlow.executionHistory];
  }

  isComplete(): boolean {
    if (!this.runtimeFlow.currentNodeId) return false;
    return this.getCurrentRuntimeNode().type === 'end';
  }

  canGoBack(): boolean {
    return (
      Boolean(this.options.enableHistory) &&
      this.runtimeFlow.executionHistory.length > 1
    );
  }

  async goBack(): Promise<ExecutionContext<TState>> {
    if (!this.canGoBack()) throw new Error('Cannot go back');

    this.runtimeFlow.executionHistory.pop();
    const previousStep =
      this.runtimeFlow.executionHistory[
        this.runtimeFlow.executionHistory.length - 1
      ];
    if (!previousStep) throw new Error('No previous step available');

    await this.stateManager.reset(previousStep.state);
    this.runtimeFlow.currentNodeId = previousStep.nodeId;
    this.runtimeFlow.state = previousStep.state;

    return this.createExecutionContext();
  }

  async reset(): Promise<void> {
    this.runtimeFlow.currentNodeId = null;
    this.runtimeFlow.executionHistory = [];
    const initialState = JSON.parse(
      JSON.stringify(this.runtimeFlow.definition.initialState || {})
    ) as TState;
    this.runtimeFlow.state = initialState;
    await this.stateManager.reset(initialState);
  }

  getState(): TState {
    return this.runtimeFlow.state;
  }

  async setState(newState: Partial<TState>): Promise<void> {
    await this.stateManager.setState(newState);
  }

  private async transitionToNode(
    nodeId: string,
    choiceId?: string
  ): Promise<ExecutionContext<TState>> {
    if (!this.runtimeFlow.nodeMap.has(nodeId)) {
      throw new Error(`Node "${nodeId}" not found`);
    }

    if (this.runtimeFlow.currentNodeId) {
      this.emit('nodeExit', {
        nodeId: this.runtimeFlow.currentNodeId,
        node: this.getCurrentRuntimeNode(),
        choiceId,
        state: this.runtimeFlow.state,
      });
    }

    if (choiceId) {
      const outletResult = this.runtimeFlow.outletMap.get(choiceId);
      if (outletResult?.outlet.actions) {
        await this.stateManager.executeActions(outletResult.outlet.actions);
      }
    }

    this.runtimeFlow.currentNodeId = nodeId;
    const nodeDef = this.runtimeFlow.nodeMap.get(nodeId)!;

    if (nodeDef.actions) {
      await this.stateManager.executeActions(nodeDef.actions);
    }

    if (this.options.enableHistory) {
      this.runtimeFlow.executionHistory.push({
        nodeId,
        choiceId,
        timestamp: new Date(),
        state: this.stateManager.getState(),
      });
      if (
        this.runtimeFlow.executionHistory.length >
        (this.options.maxHistorySize || 100)
      ) {
        this.runtimeFlow.executionHistory.shift();
      }
    }

    const runtimeNode = this.getCurrentRuntimeNode();
    this.emit('nodeEnter', {
      nodeId,
      node: runtimeNode,
      state: this.runtimeFlow.state,
    });

    const availableOutlets = this.getOutlets(nodeId);
    if (await this.shouldAutoAdvance(nodeDef, availableOutlets)) {
      const selectedOutlet =
        await this.selectAutoAdvanceOutlet(availableOutlets);
      if (selectedOutlet) {
        const targetNodeDef = this.runtimeFlow.nodeMap.get(selectedOutlet.to);
        if (targetNodeDef) {
          this.emit('autoAdvance', {
            from: runtimeNode,
            to: RuntimeFlowFactory.createRuntimeNode(
              this.runtimeFlow.definition,
              selectedOutlet.to,
              this.runtimeFlow
            ),
            condition: selectedOutlet.condition,
            outletId: selectedOutlet.id,
          });
          return this.transitionToNode(selectedOutlet.to, selectedOutlet.id);
        }
      }
    }

    return this.createExecutionContext();
  }

  private getCurrentRuntimeNode(): RuntimeNode {
    if (!this.runtimeFlow.currentNodeId) throw new Error('No current node');
    return RuntimeFlowFactory.createRuntimeNode(
      this.runtimeFlow.definition,
      this.runtimeFlow.currentNodeId,
      this.runtimeFlow
    );
  }

  private async createExecutionContext(): Promise<ExecutionContext<TState>> {
    const currentNode = this.getCurrentRuntimeNode();
    return {
      flow: this.runtimeFlow,
      currentNode: await this.getInterpolatedRuntimeNode(currentNode),
      availableChoices: await this.getAvailableChoices(),
      canGoBack: this.canGoBack(),
      isComplete: this.isComplete(),
    };
  }

  private async getInterpolatedRuntimeNode(
    node: RuntimeNode
  ): Promise<RuntimeNode> {
    const state = this.runtimeFlow.state as Record<string, unknown>;
    const interpolatedNode = { ...node };

    if (node.definition.title) {
      interpolatedNode.interpolatedTitle = await this.engine.interpolate(
        node.definition.title,
        state
      );
    }
    if (node.definition.content) {
      interpolatedNode.interpolatedContent = await this.engine.interpolate(
        node.definition.content,
        state
      );
    }
    return interpolatedNode;
  }

  private async getAvailableChoices(): Promise<RuntimeChoice[]> {
    if (!this.runtimeFlow.currentNodeId) return [];

    const currentNode = this.getCurrentRuntimeNode();
    if (currentNode.type === 'end') return [];

    const outlets = this.getOutlets(this.runtimeFlow.currentNodeId);
    const showDisabled = this.options.showDisabledChoices || false;
    const state = this.runtimeFlow.state as Record<string, unknown>;

    const choicePromises = outlets.map(async (outlet) => {
      const isEnabled = await this.evaluateOutletCondition(outlet);
      if (!showDisabled && !isEnabled) return null;

      const label = await this.engine.interpolate(
        outlet.label || 'Continue',
        state
      );

      return {
        outletId: outlet.id,
        label,
        description: outlet.metadata?.description as string,
        isEnabled,
        disabledReason:
          !isEnabled && outlet.condition ? 'Condition not met' : undefined,
        metadata: outlet.metadata,
      };
    });

    const resolvedChoices = await Promise.all(choicePromises);
    return resolvedChoices.filter(
      (c): c is NonNullable<typeof c> => c !== null
    );
  }

  private getOutlets(nodeId: string): OutletDefinition[] {
    return this.runtimeFlow.nodeMap.get(nodeId)?.outlets || [];
  }

  private async evaluateOutletCondition(
    outlet: OutletDefinition
  ): Promise<boolean> {
    if (!outlet.condition) return true;
    try {
      return await this.stateManager.evaluateCondition(outlet.condition);
    } catch (error) {
      console.warn(
        `Failed to evaluate outlet condition: ${outlet.condition}`,
        error
      );
      return false;
    }
  }

  private async evaluateAutomaticDecision(
    nodeId: string
  ): Promise<string | null> {
    for (const outlet of this.getOutlets(nodeId)) {
      if (await this.evaluateOutletCondition(outlet)) {
        return outlet.to;
      }
    }
    return null;
  }

  private async shouldAutoAdvance(
    nodeDef: NodeDefinition,
    outlets: OutletDefinition[]
  ): Promise<boolean> {
    const { autoAdvanceMode } = this.runtimeFlow.definition;
    const { autoAdvance: optionsAutoAdvance } = this.options;

    if (autoAdvanceMode === 'never' || optionsAutoAdvance === 'never')
      return false;

    if (nodeDef.autoAdvance) {
      return (await this.selectAutoAdvanceOutlet(outlets)) !== null;
    }
    if (autoAdvanceMode === 'always' || optionsAutoAdvance === 'always') {
      return (await this.selectAutoAdvanceOutlet(outlets)) !== null;
    }

    return false;
  }

  private async selectAutoAdvanceOutlet(
    outlets: OutletDefinition[]
  ): Promise<OutletDefinition | null> {
    const conditionalOutlets = outlets.filter((o) => o.condition);
    const defaultOutlets = outlets.filter((o) => !o.condition);

    for (const outlet of conditionalOutlets) {
      if (await this.evaluateOutletCondition(outlet)) return outlet;
    }

    return defaultOutlets[0] || null;
  }

  private handleForcedTransition(targetNodeId: string): void {
    if (!this.runtimeFlow.nodeMap.has(targetNodeId)) {
      this.emit('error', {
        error: new Error(
          `Target node "${targetNodeId}" not found for forced transition`
        ),
        context: { type: 'forcedTransition', targetNodeId },
      });
      return;
    }

    this.transitionToNode(targetNodeId).catch((error) => {
      this.emit('error', {
        error,
        context: { type: 'forcedTransition', targetNodeId },
      });
    });
  }
}
