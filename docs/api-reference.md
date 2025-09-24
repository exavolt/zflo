# API Reference

## Core Engine (`@zflo/core`)

### FlowEngine

The main flow execution engine for ZFlo.

```typescript
class FlowEngine<TState extends object> {
  constructor(
    flowDefinition: FlowDefinition<TState>,
    options?: EngineOptions<TState>
  );

  // Execution control
  start(): Promise<ExecutionContext<TState>>;
  next(choiceId?: string): Promise<ExecutionContext<TState>>;
  reset(): Promise<void>;
  goBack(): Promise<ExecutionContext<TState>>;

  // State access
  getCurrentContext(): Promise<ExecutionContext<TState> | null>;
  getState(): TState;
  setState(newState: Partial<TState>): Promise<void>;
  getHistory(): ExecutionStep<TState>[];
  isComplete(): boolean;
  canGoBack(): boolean;

  // Event handling
  on<K extends keyof EngineEventData<TState>>(
    event: K,
    listener: (payload: EngineEventData<TState>[K]) => void
  ): this;
  off<K extends keyof EngineEventData<TState>>(
    event: K,
    listener: (payload: EngineEventData<TState>[K]) => void
  ): this;
}
```

### Types

```typescript
interface ExecutionContext<TState extends object> {
  flow: RuntimeFlow<TState>;
  currentNode: RuntimeNode;
  availableChoices: RuntimeChoice[];
  canGoBack: boolean;
  isComplete: boolean;
}

interface RuntimeChoice {
  outletId: string;
  label: string;
  description?: string;
  isEnabled: boolean;
}

interface ExecutionStep<TState extends object> {
  nodeId: string;
  choiceId?: string;
  timestamp: Date;
  state: TState;
}
```

## Expression Language

- **Default**: Liquid is the default templating and expression language.

Examples:

```liquid
{{ user.name | capitalize }}
{% if score > 50 %}You win!{% endif %}
```

FlowEngine initialization respects `flowDefinition.expressionLanguage`:

```ts
import { FlowEngine } from '@zflo/core';

const engine = new FlowEngine({
  id: 'demo',
  title: 'Demo',
  startNodeId: 'start',
  nodes: [],
  expressionLanguage: 'liquid', // default if omitted
});
```

### ExpressionEngine

ZFlo uses a pluggable expression engine. The common interface is:

```ts
export interface ExpressionEngine {
  evaluateCondition(
    expression: string,
    context: Record<string, unknown>
  ): Promise<boolean>;
  evaluateExpression(
    expression: string,
    context: Record<string, unknown>
  ): Promise<any>;
  interpolate(
    template: string,
    context: Record<string, unknown>
  ): Promise<string>;
}
```

- **LiquidExpressionEngine** (default): Evaluates Liquid expressions.
- **CelExpressionEngine**: Evaluates CEL expressions.

### StateManager

The `StateManager` owns execution state, evaluates expressions, applies actions, and emits state changes.

```ts
class StateManager<TState extends object> {
  constructor(
    initialState: TState,
    rules?: StateRule[],
    options?: StateManagerOptions
  );

  // State access/manipulation
  getState(): TState;
  setState(newState: Partial<TState>): Promise<void>;
  executeActions(actions: StateAction[]): Promise<void>;
  reset(newState?: Partial<TState>): Promise<void>;

  // Expression evaluation
  evaluateCondition(expression: string): Promise<boolean>;

  // Events
  on(event: 'stateChange' | 'error', handler: (data: any) => void): this;
  off(event: 'stateChange' | 'error', handler: (data: any) => void): this;
}
```

### Format Parsers

```typescript
interface FormatParser {
  parse(input: string): FlowDefinition;
  validate(input: string): ValidationResult;
}

class MermaidParser implements FormatParser {
  parse(mermaidCode: string): FlowDefinition;
  validate(mermaidCode: string): ValidationResult;
}
```

## React Components (`@zflo/react`)

### FlowPlayer

Main component for rendering interactive flowcharts.

```typescript
interface FlowPlayerProps {
  flowDefinition: FlowDefinition;
  onComplete?: (history: ExecutionStep[]) => void;
  onNodeChange?: (node: RuntimeNode) => void;
  theme?: Theme;
  className?: string;
}

export const FlowPlayer: React.FC<FlowPlayerProps>;
```

### NodeRenderer

Customizable node display component.

```typescript
interface NodeRendererProps {
  node: RuntimeNode;
  choices: RuntimeChoice[];
  onChoice: (choiceId: string) => void;
  canGoBack: boolean;
  onGoBack: () => void;
}

export const NodeRenderer: React.FC<NodeRendererProps>;
```

### Hooks

```typescript
// Core execution hook
function useFlowEngine(flowDefinition: FlowDefinition): {
  context: ExecutionContext | null;
  makeChoice: (choiceId: string) => Promise<void>;
  goBack: () => Promise<void>;
  reset: () => Promise<void>;
};
```

## Usage Examples

### Basic Usage

```typescript
import { FlowEngine, MermaidParser } from '@zflo/core';

const mermaidCode = `
flowchart TD
    A[Start] --> B{Choose}
    B -->|Yes| C[Success]
    B -->|No| D[Failure]
`;

const parser = new MermaidParser();
const flowDefinition = parser.parse(mermaidCode);
const engine = new FlowEngine(flowDefinition);

// Start execution
const context = await engine.start();
console.log(context.currentNode.definition.title); // "Start"

// Make a choice
const nextContext = await engine.next('yes');
console.log(nextContext.currentNode.definition.title); // "Success"
```

### React Integration

```tsx
import { FlowPlayer } from '@zflo/react';

function App() {
  return (
    <FlowPlayer
      flowDefinition={flowDefinition}
      onComplete={(history) => {
        console.log('Adventure completed!', history);
      }}
      theme="dark"
    />
  );
}
```
