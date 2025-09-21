# API Reference

## Core Engine (`@zflo/core`)

### FlowEngine

The main flow execution engine for ZFlo.

```typescript
class FlowEngine {
  constructor(flowchart: ZFFlow, options?: EngineOptions);

  // Execution control
  start(): Promise<ExecutionResult>;
  next(choice?: string): Promise<ExecutionResult>;
  reset(): void;
  goBack(): Promise<ExecutionResult | null>;

  // State access
  getCurrentNode(): ZFNode | null;
  getHistory(): ExecutionStep[];
  getAvailableChoices(): Choice[];
  getState(): Record<string, any>;
  isComplete(): boolean;
  canGoBack(): boolean;

  // Event handling
  on(event: EngineEvent, handler: EventHandler): void;
  off(event: EngineEvent, handler: EventHandler): void;
}
```

### Types

```typescript
interface ExecutionResult {
  node: AnnotatedNode;
  choices: Choice[];
  state: Record<string, any>;
  isComplete: boolean;
  canGoBack: boolean;
}

interface Choice {
  id: string;
  label: string;
  description?: string;
}

interface ExecutionStep {
  node: ZFNode;
  choice?: string;
  timestamp: Date;
}

type EngineEvent =
  | 'nodeEnter'
  | 'nodeExit'
  | 'stateChange'
  | 'autoAdvance'
  | 'complete'
  | 'error';
```

## Expression Language

- **Default**: CEL (Common Expression Language) is used for all conditions and rules.

Examples:

```text
"sword" in inventory && health > 50
"key" in inventory
```

FlowEngine initialization respects `flowchart.expressionLanguage`:

```ts
import { FlowEngine } from '@zflo/core';

const engine = new FlowEngine({
  id: 'demo',
  title: 'Demo',
  startNodeId: 'start',
  nodes: [],
  expressionLanguage: 'cel', // default if omitted
});
```

### Expression Evaluators

ZFlo uses stateless evaluators behind the scenes. The common interface is:

```ts
export interface ExpressionEvaluator {
  evaluate(
    expression: string,
    context: Record<string, any>,
    options?: { onError?: (error: Error) => void }
  ): boolean;
  clearCache?(): void;
}
```

- CelEvaluator (default): Evaluates CEL expressions. Compiled parses are cached per expression for performance. Non-boolean results are coerced to boolean.

```text
"sword" in inventory
```

Minimal usage via StateManager:

```ts
import { StateManager } from '@zflo/core';

const manager = new StateManager({}, [], { expressionLanguage: 'cel' });
manager.evaluateCondition('"sword" in inventory');
```

### StateManager

The `StateManager` owns execution state, evaluates expressions, applies actions, and emits state changes.

```ts
class StateManager {
  constructor(
    initialState?: Record<string, any>,
    rules?: StateRule[],
    options?: { expressionLanguage?: 'cel' }
  );

  // State access/manipulation
  getState(): Record<string, any>;
  setState(newState: Record<string, any>): void;
  executeActions(actions: StateAction[]): void;
  reset(newState?: Record<string, any>): void;

  // Expression evaluation
  evaluateCondition(expression: string): boolean;

  // Events
  on(event: 'stateChange' | 'error', handler: (data: any) => void): void;
  off(event: 'stateChange' | 'error', handler: (data: any) => void): void;
}
```

Notes:

- Default language is CEL; configure per flow in `flowchart.expressionLanguage` or per expression via prefixes.
- Evaluators are stateless; `StateManager` passes the current state as context on each evaluation.

### Format Parsers

```typescript
interface FormatParser {
  parse(input: string): ZFFlow;
  validate(input: string): ValidationResult;
}

class MermaidParser implements FormatParser {
  parse(mermaidCode: string): ZFFlow;
  validate(mermaidCode: string): ValidationResult;
}
```

## React Components (`@zflo/react`)

### FlowPlayer

Main component for rendering interactive flowcharts.

```typescript
interface FlowPlayerProps {
  flowchart: ZFFlow;
  onComplete?: (history: ExecutionStep[]) => void;
  onNodeChange?: (node: ZFNode) => void;
  theme?: Theme;
  className?: string;
}

export const FlowPlayer: React.FC<FlowPlayerProps>;
```

### NodeRenderer

Customizable node display component.

```typescript
interface NodeRendererProps {
  node: ZFNode;
  choices: Choice[];
  onChoice: (choiceId: string) => void;
  canGoBack: boolean;
  onGoBack: () => void;
}

export const NodeRenderer: React.FC<NodeRendererProps>;
```

### Hooks

```typescript
// Core execution hook
function useFlowchartEngine(flowchart: ZFFlow): {
  currentNode: ZFNode | null;
  choices: Choice[];
  isComplete: boolean;
  makeChoice: (choiceId: string) => void;
  goBack: () => void;
  reset: () => void;
};

// History management
function useExecutionHistory(): {
  history: ExecutionStep[];
  canGoBack: boolean;
  goToStep: (stepIndex: number) => void;
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
const flowchart = parser.parse(mermaidCode);
const engine = new FlowEngine(flowchart);

// Start execution
const result = await engine.start();
console.log(result.node.title); // "Start"

// Make a choice
const nextResult = await engine.next('yes');
console.log(nextResult.node.title); // "Success"
```

### React Integration

```tsx
import { FlowPlayer } from '@zflo/react';

function App() {
  return (
    <FlowPlayer
      flowchart={flowchart}
      onComplete={(history) => {
        console.log('Adventure completed!', history);
      }}
      theme="dark"
    />
  );
}
```
