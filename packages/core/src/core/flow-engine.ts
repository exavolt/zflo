import { EventEmitter } from 'eventemitter3';
import { StateManager } from './state-manager';
import { ContentInterpolator } from '../utils/content-interpolator';
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

/**
 * New FlowEngine implementation using the refactored architecture
 */
export class FlowEngine<
  TState extends object = Record<string, unknown>,
> extends EventEmitter<EngineEventData<TState>> {
  private runtimeFlow: RuntimeFlow<TState>;
  private stateManager: IStateManager<TState>;
  private options: EngineOptions<TState>;
  private contentInterpolator: ContentInterpolator;

  constructor(
    flowDefinition: FlowDefinition<TState>,
    options: EngineOptions<TState> = {}
  ) {
    super();

    this.options = {
      enableHistory: true,
      maxHistorySize: 100,
      autoSave: false,
      ...options,
    };

    // Create runtime flow
    this.runtimeFlow = RuntimeFlowFactory.create(
      flowDefinition,
      options.initialState
    );

    // Initialize state manager
    if (options.stateManager) {
      this.stateManager = options.stateManager;
    } else {
      this.stateManager = new StateManager<TState>(
        this.runtimeFlow.state,
        flowDefinition.afterStateChangeRules || [],
        {
          expressionLanguage: flowDefinition.expressionLanguage ?? 'cel',
          stateSchema: flowDefinition.stateSchema,
          validateOnChange: true,
        }
      );
    }

    // Initialize content interpolator
    this.contentInterpolator = new ContentInterpolator({
      expressionLanguage: flowDefinition.expressionLanguage ?? 'cel',
      enableLogging: options.enableLogging ?? false,
    });

    // Forward state manager events
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
    const startNodeDef = this.runtimeFlow.nodeMap.get(
      this.runtimeFlow.definition.startNodeId
    );
    if (!startNodeDef) {
      throw new Error(
        `Start node with id "${this.runtimeFlow.definition.startNodeId}" not found`
      );
    }

    return this.transitionToNode(this.runtimeFlow.definition.startNodeId);
  }

  async next(choiceId?: string): Promise<ExecutionContext<TState>> {
    if (!this.runtimeFlow.currentNodeId) {
      throw new Error('No current node. Call start() first.');
    }

    const currentNode = this.getCurrentRuntimeNode();
    let targetNodeId: string | null = null;

    if (choiceId) {
      // Handle user choice
      const outletResult = this.runtimeFlow.outletMap.get(choiceId);
      if (
        !outletResult ||
        outletResult.fromNodeId !== this.runtimeFlow.currentNodeId
      ) {
        throw new Error(`Invalid choice: ${choiceId}`);
      }
      targetNodeId = outletResult.outlet.to;
    } else {
      // Handle automatic progression
      if (currentNode.type === 'decision') {
        targetNodeId = this.evaluateAutomaticDecision(
          this.runtimeFlow.currentNodeId
        );
      } else if (currentNode.type === 'action') {
        const outlets = this.getOutlets(this.runtimeFlow.currentNodeId);
        if (outlets.length === 1 && outlets[0]) {
          targetNodeId = outlets[0].to;
        }
      }
    }

    if (!targetNodeId && currentNode.type !== 'decision') {
      throw new Error('No valid transition found');
    }

    if (currentNode.type === 'decision' && !choiceId) {
      return this.createExecutionContext();
    }

    if (!targetNodeId) {
      throw new Error('No valid transition found');
    }

    return this.transitionToNode(targetNodeId, choiceId);
  }

  getCurrentContext(): ExecutionContext<TState> | null {
    if (!this.runtimeFlow.currentNodeId) {
      return null;
    }
    return this.createExecutionContext();
  }

  getHistory(): ExecutionStep<TState>[] {
    return [...this.runtimeFlow.executionHistory];
  }

  isComplete(): boolean {
    if (!this.runtimeFlow.currentNodeId) {
      return false;
    }
    const currentNode = this.getCurrentRuntimeNode();
    return currentNode.type === 'end';
  }

  canGoBack(): boolean {
    return (
      Boolean(this.options.enableHistory) &&
      this.runtimeFlow.executionHistory.length > 1
    );
  }

  async goBack(): Promise<ExecutionContext<TState>> {
    if (!this.canGoBack()) {
      throw new Error('Cannot go back');
    }

    // Remove current step and go to previous
    this.runtimeFlow.executionHistory.pop();
    const previousStep =
      this.runtimeFlow.executionHistory[
        this.runtimeFlow.executionHistory.length - 1
      ];
    if (!previousStep) {
      throw new Error('No previous step available');
    }

    // Restore previous state
    this.stateManager.reset(previousStep.state);
    this.runtimeFlow.currentNodeId = previousStep.nodeId;
    this.runtimeFlow.state = previousStep.state;

    return this.createExecutionContext();
  }

  reset(): void {
    this.runtimeFlow.currentNodeId = null;
    this.runtimeFlow.executionHistory = [];
    const initialState = {
      ...JSON.parse(
        JSON.stringify(this.runtimeFlow.definition.initialState || {})
      ),
    } as TState;
    this.runtimeFlow.state = initialState;
    this.stateManager.reset(initialState);
  }

  getState(): TState {
    return this.runtimeFlow.state;
  }

  getStateManager(): IStateManager<TState> {
    return this.stateManager;
  }

  private async transitionToNode(
    nodeId: string,
    choiceId?: string
  ): Promise<ExecutionContext<TState>> {
    const nodeDef = this.runtimeFlow.nodeMap.get(nodeId);
    if (!nodeDef) {
      throw new Error(`Node with id "${nodeId}" not found`);
    }

    // Exit current node
    if (this.runtimeFlow.currentNodeId) {
      const currentNode = this.getCurrentRuntimeNode();
      this.emit('nodeExit', {
        nodeId: this.runtimeFlow.currentNodeId,
        node: currentNode,
        choiceId,
        state: this.runtimeFlow.state,
      });
    }

    // Execute outlet actions if transitioning via a specific outlet
    if (choiceId) {
      const outletResult = this.runtimeFlow.outletMap.get(choiceId);
      if (outletResult?.outlet.actions) {
        this.stateManager.executeActions(outletResult.outlet.actions);
      }
    }

    // Update current node
    this.runtimeFlow.currentNodeId = nodeId;

    // Execute node actions
    if (nodeDef.actions) {
      this.stateManager.executeActions(nodeDef.actions);
    }

    // Add to history
    if (this.options.enableHistory) {
      const step: ExecutionStep<TState> = {
        nodeId,
        choiceId,
        timestamp: new Date(),
        state: this.stateManager.getState(),
      };
      this.runtimeFlow.executionHistory.push(step);

      // Limit history size
      const maxSize = this.options.maxHistorySize || 100;
      if (this.runtimeFlow.executionHistory.length > maxSize) {
        this.runtimeFlow.executionHistory.shift();
      }
    }

    // Create runtime node and emit enter event
    const runtimeNode = this.getCurrentRuntimeNode();
    this.emit('nodeEnter', {
      nodeId,
      node: runtimeNode,
      state: this.runtimeFlow.state,
    });

    // Check for auto-advance
    const availableOutlets = this.getOutlets(nodeId);
    if (this.shouldAutoAdvance(nodeDef, availableOutlets)) {
      const selectedOutlet = this.selectAutoAdvanceOutlet(availableOutlets);
      if (selectedOutlet) {
        const targetNodeDef = this.runtimeFlow.nodeMap.get(selectedOutlet.to);
        if (targetNodeDef) {
          const targetRuntimeNode = RuntimeFlowFactory.createRuntimeNode(
            this.runtimeFlow.definition,
            selectedOutlet.to,
            this.runtimeFlow
          );

          this.emit('autoAdvance', {
            from: runtimeNode,
            to: targetRuntimeNode,
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
    if (!this.runtimeFlow.currentNodeId) {
      throw new Error('No current node');
    }
    return RuntimeFlowFactory.createRuntimeNode(
      this.runtimeFlow.definition,
      this.runtimeFlow.currentNodeId,
      this.runtimeFlow
    );
  }

  private createExecutionContext(): ExecutionContext<TState> {
    const currentNode = this.getCurrentRuntimeNode();
    const availableChoices = this.getAvailableChoices();

    return {
      flow: this.runtimeFlow,
      currentNode: this.getInterpolatedRuntimeNode(currentNode),
      availableChoices,
      canGoBack: this.canGoBack(),
      isComplete: this.isComplete(),
    };
  }

  private getInterpolatedRuntimeNode(node: RuntimeNode): RuntimeNode {
    const currentState = this.runtimeFlow.state;
    let interpolatedNode = { ...node };

    // Interpolate title
    if (
      node.definition.title &&
      this.contentInterpolator.hasInterpolations(node.definition.title)
    ) {
      const titleResult = this.contentInterpolator.interpolate(
        node.definition.title,
        currentState as Record<string, unknown>
      );
      interpolatedNode.interpolatedTitle = titleResult.content;
    }

    // Interpolate content
    if (
      node.definition.content &&
      this.contentInterpolator.hasInterpolations(node.definition.content)
    ) {
      const contentResult = this.contentInterpolator.interpolate(
        node.definition.content,
        currentState as Record<string, unknown>
      );
      interpolatedNode.interpolatedContent = contentResult.content;
    }

    return interpolatedNode;
  }

  private getAvailableChoices(): RuntimeChoice[] {
    if (!this.runtimeFlow.currentNodeId) {
      return [];
    }

    const currentNode = this.getCurrentRuntimeNode();
    if (currentNode.type === 'end') {
      return [];
    }

    const allOutlets = this.getOutlets(this.runtimeFlow.currentNodeId);
    const showDisabled = this.options.showDisabledChoices || false;
    const currentState = this.runtimeFlow.state;

    const choices: RuntimeChoice[] = [];

    for (const outlet of allOutlets) {
      const isEnabled = this.evaluateOutletCondition(outlet);

      if (!showDisabled && !isEnabled) {
        continue;
      }

      let label = outlet.label || 'Continue';
      if (this.contentInterpolator.hasInterpolations(label)) {
        const labelResult = this.contentInterpolator.interpolate(
          label,
          currentState as Record<string, unknown>
        );
        label = labelResult.content;
      }

      choices.push({
        outletId: outlet.id,
        label,
        description: outlet.metadata?.description as string,
        isEnabled,
        disabledReason:
          !isEnabled && outlet.condition ? 'Condition not met' : undefined,
        metadata: outlet.metadata,
      });
    }

    return choices;
  }

  private getOutlets(nodeId: string): OutletDefinition[] {
    const nodeDef = this.runtimeFlow.nodeMap.get(nodeId);
    return nodeDef?.outlets || [];
  }

  private evaluateOutletCondition(outlet: OutletDefinition): boolean {
    if (!outlet.condition) return true;

    try {
      return this.stateManager.evaluateCondition(outlet.condition);
    } catch (error) {
      console.warn(
        `Failed to evaluate outlet condition: ${outlet.condition}`,
        error
      );
      return false;
    }
  }

  private evaluateAutomaticDecision(nodeId: string): string | null {
    const outlets = this.getOutlets(nodeId);

    for (const outlet of outlets) {
      if (this.evaluateOutletCondition(outlet)) {
        return outlet.to;
      }
    }

    return null;
  }

  private shouldAutoAdvance(
    nodeDef: NodeDefinition,
    availableOutlets: OutletDefinition[]
  ): boolean {
    if (
      this.runtimeFlow.definition.autoAdvanceMode === 'never' ||
      this.options.autoAdvance === 'never'
    ) {
      return false;
    }

    if (nodeDef.autoAdvance) {
      return this.selectAutoAdvanceOutlet(availableOutlets) !== null;
    } else if (
      this.runtimeFlow.definition.autoAdvanceMode === 'always' ||
      this.options.autoAdvance === 'always'
    ) {
      return this.selectAutoAdvanceOutlet(availableOutlets) !== null;
    }

    return false;
  }

  private selectAutoAdvanceOutlet(
    availableOutlets: OutletDefinition[]
  ): OutletDefinition | null {
    // Separate conditional and default outlets
    const conditionalOutlets = availableOutlets.filter(
      (outlet) => outlet.condition
    );
    const defaultOutlets = availableOutlets.filter(
      (outlet) => !outlet.condition
    );

    // Evaluate conditional outlets first
    for (const outlet of conditionalOutlets) {
      if (this.evaluateOutletCondition(outlet)) {
        return outlet;
      }
    }

    // Use default outlet if no conditional matches
    return defaultOutlets[0] || null;
  }

  private handleForcedTransition(targetNodeId: string): void {
    const targetNodeDef = this.runtimeFlow.nodeMap.get(targetNodeId);
    if (!targetNodeDef) {
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
