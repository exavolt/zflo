import { EventEmitter } from 'eventemitter3';
import { StateManager } from './state-manager';
import { ContentInterpolator } from '../utils/content-interpolator';
import {
  AnnotatedNode,
  Choice,
  EngineEventData,
  EngineOptions,
  ExecutionResult,
  ExecutionStep,
  IStateManager,
} from '../types/execution-types';
import {
  NodeType,
  StateRule,
  ZFFlow,
  ZFNode,
  XFOutlet,
} from '../types/flow-types';
import { inferNodeTypes } from '../utils/infer-node-types';

export class FlowEngine<
  TState extends object = Record<string, unknown>,
> extends EventEmitter<EngineEventData<TState>> {
  private flow: ZFFlow;
  private nodeTypes: Record<string, NodeType>;
  private stateManager: IStateManager<TState>;
  private currentNode: ZFNode | null = null;
  private history: ExecutionStep<TState>[] = [];
  private options: EngineOptions<TState>;
  private contentInterpolator: ContentInterpolator;

  constructor(flow: ZFFlow, options: EngineOptions<TState> = {}) {
    super();
    this.flow = flow;
    this.nodeTypes = inferNodeTypes(flow.nodes);
    this.options = {
      enableHistory: true,
      maxHistorySize: 100,
      autoSave: false,
      ...options,
    };

    // Initialize state manager with deep cloned state to avoid reference sharing
    const initialState = {
      ...JSON.parse(JSON.stringify(flow.globalState || {})),
      ...JSON.parse(JSON.stringify(options.initialState || {})),
    };

    // Use provided StateManager or create default one
    if (options.stateManager) {
      this.stateManager = options.stateManager;
    } else {
      this.stateManager = new StateManager<TState>(
        initialState as TState,
        flow.stateRules || [],
        {
          expressionLanguage: flow.expressionLanguage ?? 'cel',
          stateSchema: flow.stateSchema,
          validateOnChange: true,
        }
      );
    }

    // Initialize content interpolator
    this.contentInterpolator = new ContentInterpolator({
      expressionLanguage: flow.expressionLanguage ?? 'cel',
      enableLogging: options.enableLogging ?? false,
    });

    // Forward state manager events
    this.stateManager.on(
      'stateChange',
      (data: { oldState: TState; newState: TState }) =>
        this.emit('stateChange', data)
    );
    this.stateManager.on(
      'error',
      (data: {
        error: Error;
        context?: { type: string; rule?: StateRule };
      }) => {
        if (
          data.context?.type === 'forceTransition' &&
          data.context.rule?.target
        ) {
          // Handle forced transitions from state rules
          this.handleForcedTransition(data.context.rule.target);
        } else {
          this.emit('error', data);
        }
      }
    );
  }

  async start(): Promise<ExecutionResult<TState>> {
    const startNode = this.findNodeById(this.flow.startNodeId);
    if (!startNode) {
      throw new Error(
        `Start node with id "${this.flow.startNodeId}" not found`
      );
    }

    return this.transitionToNode(startNode);
  }

  async next(choiceId?: string): Promise<ExecutionResult<TState>> {
    if (!this.currentNode) {
      throw new Error('No current node. Call start() first.');
    }

    let targetNode: ZFNode | null = null;
    const currentNodeType = this.nodeTypes[this.currentNode.id];

    if (choiceId) {
      // Handle user choice (for any node type that has choices)
      const outletResult = this.findOutletById(choiceId);
      if (!outletResult || outletResult.fromNodeId !== this.currentNode.id) {
        throw new Error(`Invalid choice: ${choiceId}`);
      }
      targetNode = this.findNodeById(outletResult.outlet.to);
    } else {
      if (currentNodeType === 'decision') {
        // Handle automatic decision evaluation if no choice provided
        targetNode = this.evaluateAutomaticDecision(this.currentNode);
      } else {
        // Handle automatic progression for action nodes only
        // Decision nodes should not auto-progress - they wait for user choice
        if (currentNodeType === 'action') {
          const outlets = this.getOutlets(this.currentNode.id);
          if (outlets.length === 1 && outlets[0]) {
            targetNode = this.findNodeById(outlets[0].to);
          }
        }
      }
    }

    if (!targetNode && currentNodeType !== 'decision') {
      throw new Error('No valid transition found');
    }

    // If this is a decision node and no choice was made, don't transition
    if (currentNodeType === 'decision' && !choiceId) {
      return this.createExecutionResult();
    }

    if (!targetNode) {
      throw new Error('No valid transition found');
    }

    return this.transitionToNode(targetNode, choiceId);
  }

  getCurrentNode(): AnnotatedNode | null {
    if (!this.currentNode) {
      return null;
    }
    const nodeType = this.nodeTypes[this.currentNode.id];
    if (!nodeType) {
      throw new Error(`Node type not found for node: ${this.currentNode.id}`);
    }
    return {
      node: this.getInterpolatedNode(this.currentNode),
      type: nodeType,
    };
  }

  getHistory(): ExecutionStep<TState>[] {
    return [...this.history];
  }

  getAvailableChoices(): Choice[] {
    if (!this.currentNode) {
      return [];
    }
    const currentNodeType = this.nodeTypes[this.currentNode.id];
    if (currentNodeType === 'end') {
      return [];
    }

    const allOutlets = this.getOutlets(this.currentNode.id);
    const showDisabled = this.options.showDisabledChoices || false;
    const currentState = this.stateManager.getState();

    let outletsToShow: XFOutlet[];
    let choices: Choice[];
    const isSingleChoice = allOutlets.length === 1;

    const singleChoiceDefaultLabel = 'Continue';

    if (showDisabled) {
      // Show all outlets, mark disabled ones
      outletsToShow = allOutlets;
      choices = outletsToShow.map((outlet, index): Choice => {
        const isEnabled = this.evaluateOutletCondition(outlet);
        const description =
          outlet.metadata &&
          'description' in outlet.metadata &&
          typeof outlet.metadata.description === 'string'
            ? outlet.metadata.description
            : undefined;

        // Get the label with interpolation support
        let label = this.contentInterpolator.interpolate(
          outlet.label
            ? outlet.label
            : isSingleChoice
              ? singleChoiceDefaultLabel
              : 'Choice ' + (index + 1), // Ensure outlets have labels
          currentState as Record<string, unknown>
        ).content;

        return {
          id: outlet.id,
          label,
          description,
          outletId: outlet.id,
          disabled: !isEnabled,
          disabledReason:
            !isEnabled && outlet.condition
              ? 'Condition not met' // `Condition not met: ${outlet.condition}`
              : undefined,
        };
      });
    } else {
      // Only show enabled outlets (current behavior)
      outletsToShow = allOutlets.filter((outlet) =>
        this.evaluateOutletCondition(outlet)
      );
      choices = outletsToShow.map((outlet, index): Choice => {
        // Get the label with interpolation support
        let label = this.contentInterpolator.interpolate(
          outlet.label
            ? outlet.label
            : isSingleChoice
              ? singleChoiceDefaultLabel
              : 'Choice ' + (index + 1), // Ensure outlets have labels
          currentState as Record<string, unknown>
        ).content;

        return {
          id: outlet.id,
          label,
          description:
            outlet.metadata &&
            'description' in outlet.metadata &&
            typeof outlet.metadata.description === 'string'
              ? outlet.metadata.description
              : undefined,
          outletId: outlet.id,
        };
      });
    }

    // If there's only one enabled outlet forward, create a "Continue" choice
    const enabledChoices = showDisabled
      ? choices.filter((choice) => !choice.disabled)
      : choices;

    if (
      enabledChoices.length === 1 &&
      enabledChoices[0] &&
      !enabledChoices[0].label?.trim()
    ) {
      const continueChoice = enabledChoices[0];
      if (!continueChoice.id || !continueChoice.outletId) {
        throw new Error('Invalid choice structure: missing required fields');
      }
      const targetOutlet = outletsToShow.find(
        (p) => p.id === continueChoice.id
      );
      const targetNode = targetOutlet
        ? this.findNodeById(targetOutlet.to)
        : null;
      return [
        {
          ...continueChoice,
          id: continueChoice.id,
          outletId: continueChoice.outletId,
          label: singleChoiceDefaultLabel,
          description: `Continue to ${targetNode?.title || 'next step'}`,
        },
        ...choices.filter((choice) => choice.disabled), // Add any disabled choices if showing them
      ];
    }

    return choices;
  }

  isComplete(): boolean {
    if (!this.currentNode) {
      return false;
    }
    const currentNodeType = this.nodeTypes[this.currentNode.id];
    return currentNodeType === 'end';
  }

  canGoBack(): boolean {
    return Boolean(this.options.enableHistory) && this.history.length > 1;
  }

  goBack(): Promise<ExecutionResult<TState>> {
    if (!this.canGoBack()) {
      throw new Error('Cannot go back');
    }

    // Remove current step and go to previous
    this.history.pop();
    const previousStep = this.history[this.history.length - 1];
    if (!previousStep) {
      throw new Error('No previous step available');
    }

    // Restore previous state
    this.stateManager.reset(previousStep.state);
    this.currentNode = previousStep.node.node;

    return Promise.resolve(this.createExecutionResult());
  }

  reset(): void {
    this.currentNode = null;
    this.history = [];
    // Deep clone globalState to avoid reference sharing on reset
    this.stateManager.reset(
      JSON.parse(JSON.stringify(this.flow.globalState || {}))
    );
  }

  getState(): TState {
    return this.stateManager.getState();
  }

  getStateManager(): IStateManager<TState> {
    return this.stateManager;
  }

  private async transitionToNode(
    node: ZFNode,
    choiceId?: string
  ): Promise<ExecutionResult<TState>> {
    // Exit current node
    if (this.currentNode) {
      this.emit('nodeExit', {
        node: this.currentNode,
        choice: choiceId,
        state: this.stateManager.getState(),
      });
    }

    // Execute outlet actions if transitioning via a specific outlet
    if (choiceId && this.currentNode) {
      const outletResult = this.findOutletById(choiceId);
      if (outletResult?.outlet.actions) {
        this.stateManager.executeActions(outletResult.outlet.actions);
      }
    }

    // Update current node
    this.currentNode = node;

    // Execute node actions
    if (node.actions) {
      this.stateManager.executeActions(node.actions);
    }

    // Add to history
    if (this.options.enableHistory) {
      const nodeType = this.nodeTypes[node.id];
      if (!nodeType) {
        throw new Error(`Node type not found for node: ${node.id}`);
      }
      const step: ExecutionStep<TState> = {
        node: { node, type: nodeType },
        choice: choiceId,
        timestamp: new Date(),
        state: this.stateManager.getState(),
      };
      this.history.push(step);

      // Limit history size
      const maxSize = this.options.maxHistorySize || 100;
      if (this.history.length > maxSize) {
        this.history.shift();
      }
    }

    // Emit node enter event
    this.emit('nodeEnter', {
      node,
      state: this.stateManager.getState(),
    });

    // Check for auto-advance conditions
    const availableOutlets = this.getOutlets(node.id);
    if (this.shouldAutoAdvance(node, availableOutlets)) {
      const selectedOutlet = this.selectAutoAdvanceOutlet(
        node,
        availableOutlets
      );
      if (!selectedOutlet) {
        this.emit('error', {
          error: new Error(
            `No valid outlet found for auto-advance from node "${node.id}"`
          ),
          context: {
            node,
            availableOutlets,
          },
        });
        return this.createExecutionResult();
      }

      const nodeTo = this.flow.nodes.find((n) => n.id === selectedOutlet.to);
      if (!nodeTo) {
        this.emit('error', {
          error: new Error(`Node with id "${selectedOutlet.to}" not found`),
          context: {
            node,
            outlet: selectedOutlet,
          },
        });
        return this.createExecutionResult();
      }

      this.emit('autoAdvance', {
        from: node,
        to: nodeTo,
        condition: selectedOutlet.condition,
      });

      return this.transitionToNode(nodeTo, selectedOutlet.id);
    }

    return this.createExecutionResult();
  }

  private evaluateAutomaticDecision(node: ZFNode): ZFNode | null {
    // Get available outlets and sort by priority
    const availableOutlets = this.getOutlets(node.id);
    const sortedOutlets = [...availableOutlets];

    // Find first outlet with satisfied condition
    for (const outlet of sortedOutlets) {
      if (this.evaluateOutletCondition(outlet)) {
        return this.findNodeById(outlet.to);
      }
    }

    return null;
  }

  private evaluateOutletCondition(outlet: XFOutlet): boolean {
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

  /**
   * Selects the appropriate outlet for auto-advance using if-else style logic.
   * Evaluates outlets in order, returning the first outlet whose condition is true.
   * If no conditional outlets match, returns the default outlet (one without condition).
   */
  private selectAutoAdvanceOutlet(
    _node: ZFNode,
    availableOutlets: XFOutlet[]
  ): XFOutlet | null {
    // Separate conditional and default outlets
    const conditionalOutlets = availableOutlets.filter(
      (outlet) => outlet.condition
    );
    const defaultOutlets = availableOutlets.filter(
      (outlet) => !outlet.condition
    );

    // Evaluate conditional outlets in order (if-else if logic)
    for (const outlet of conditionalOutlets) {
      if (this.evaluateOutletCondition(outlet)) {
        return outlet;
      }
    }

    // If no conditional outlet matches, use the default outlet (else clause)
    if (defaultOutlets.length > 0 && defaultOutlets[0]) {
      return defaultOutlets[0];
    }

    // No valid outlet found
    return null;
  }

  /**
   * Get a node with interpolated content and title
   */
  private getInterpolatedNode(node: ZFNode): ZFNode {
    const currentState = this.stateManager.getState();
    let interpolatedNode = { ...node };
    let hasAnyInterpolations = false;
    const allErrors: string[] = [];

    // Interpolate node title if it has interpolations
    if (node.title && this.contentInterpolator.hasInterpolations(node.title)) {
      const titleResult = this.contentInterpolator.interpolate(
        node.title,
        currentState as Record<string, unknown>
      );
      interpolatedNode.title = titleResult.content;
      hasAnyInterpolations = true;
      allErrors.push(...titleResult.errors);
    }

    // Interpolate node content if it has interpolations
    if (
      node.content &&
      this.contentInterpolator.hasInterpolations(node.content)
    ) {
      const contentResult = this.contentInterpolator.interpolate(
        node.content,
        currentState as Record<string, unknown>
      );
      interpolatedNode.content = contentResult.content;
      hasAnyInterpolations = true;
      allErrors.push(...contentResult.errors);
    }

    // Log any interpolation errors if logging is enabled
    if (allErrors.length > 0 && this.options.enableLogging) {
      console.warn(`Interpolation errors for node "${node.id}":`, allErrors);
    }

    // Return original node if no interpolations were found
    if (!hasAnyInterpolations) {
      return node;
    }

    return interpolatedNode;
  }

  private createExecutionResult(): ExecutionResult<TState> {
    if (!this.currentNode) {
      throw new Error('No current node. Call start() first.');
    }
    const nodeType = this.nodeTypes[this.currentNode.id];
    if (!nodeType) {
      throw new Error(`Node type not found for node: ${this.currentNode.id}`);
    }
    return {
      node: {
        node: this.getInterpolatedNode(this.currentNode),
        type: nodeType,
      },
      choices: this.getAvailableChoices(),
      isComplete: this.isComplete(),
      canGoBack: this.canGoBack(),
      state: this.stateManager.getState(),
    };
  }

  private handleForcedTransition(targetNodeId: string): void {
    const targetNode = this.findNodeById(targetNodeId);
    if (!targetNode) {
      this.emit('error', {
        error: new Error(
          `Target node "${targetNodeId}" not found for forced transition`
        ),
        context: { type: 'forcedTransition', targetNodeId },
      });
      return;
    }

    this.transitionToNode(targetNode).catch((error) => {
      this.emit('error', {
        error,
        context: { type: 'forcedTransition', targetNodeId },
      });
    });
  }

  private shouldAutoAdvance(
    node: ZFNode,
    availableOutlets: XFOutlet[]
  ): boolean {
    if (
      this.flow.autoAdvance === 'never' ||
      this.options.autoAdvance === 'never'
    ) {
      return false;
    }
    if (node.isAutoAdvance) {
      return this.selectAutoAdvanceOutlet(node, availableOutlets) !== null;
    } else if (
      this.flow.autoAdvance === 'always' ||
      this.options.autoAdvance === 'always'
    ) {
      return this.selectAutoAdvanceOutlet(node, availableOutlets) !== null;
    } else {
      return false;
    }
  }

  private findNodeById(id: string): ZFNode | null {
    return this.flow.nodes.find((node) => node.id === id) || null;
  }

  private getOutlets(nodeId: string): XFOutlet[] {
    const node = this.findNodeById(nodeId);
    return node?.outlets || [];
  }

  private findOutletById(
    outletId: string
  ): { outlet: XFOutlet; fromNodeId: string } | null {
    for (const node of this.flow.nodes) {
      if (node.outlets) {
        const outlet = node.outlets.find((p) => p.id === outletId);
        if (outlet) {
          return { outlet, fromNodeId: node.id };
        }
      }
    }
    return null;
  }
}
