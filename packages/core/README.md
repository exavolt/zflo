# @zflo/core

Core package for ZFlo flow execution framework.

- UI-agnostic engine and types
- Deterministic state management and rule evaluation (CEL by default)
- Event-driven execution and history tracking

## Install

```bash
pnpm add @zflo/core
```

## Quick start (branching + state)

```ts
import { FlowEngine, type FlowDefinition } from '@zflo/core';

// Branching flow with state and CEL conditions
const flow: FlowDefinition = {
  id: 'dragon-quest',
  title: 'Dragon Quest',
  startNodeId: 'start',
  expressionLanguage: 'cel',
  globalState: { flags: { hasSword: false } },
  nodes: [
    {
      id: 'start',
      title: 'Village Gate',
      content: 'You stand at the village gate. A dragon threatens the land.',
      outlets: [{ id: 'to-decision', to: 'decision', label: 'Continue' }],
    },
    {
      id: 'decision',
      title: 'Prepare for Battle',
      content: 'Will you gather a weapon or charge in?',
      outlets: [
        {
          id: 'fight-now',
          to: 'fight',
          label: 'Fight the dragon',
          // Only enabled when you already have a sword
          condition: 'flags.hasSword == true',
        },
        {
          id: 'find-sword',
          to: 'armory',
          label: 'Find a sword first',
          // Default path when condition above is false
        },
      ],
    },
    {
      id: 'armory',
      title: 'Village Armory',
      content: 'You obtain a sword.',
      // Set some state when entering this node
      actions: [{ type: 'set', target: 'flags.hasSword', value: true }],
      outlets: [{ id: 'back-to-decision', to: 'decision', label: 'Return' }],
    },
    {
      id: 'fight',
      title: 'Dragon Lair',
      content:
        'You confront the dragon with your ${flags.hasSword ? "shiny sword" : "bare hands"}.',
      outlets: [{ id: 'end-victory', to: 'victory', label: 'Strike!' }],
    },
    {
      id: 'victory',
      title: 'Victory',
      content: 'The dragon is defeated. The village is safe!',
      // End nodes have no outlets; type is inferred as "end"
    },
  ],
};

const engine = new FlowEngine(flow);

// Step 1: start the flow
let res = await engine.start();
console.log(res.node.node.title); // "Village Gate"
console.log(res.choices.map((c) => c.label)); // ["Continue"]

// Step 2: move to decision (single outgoing path)
res = await engine.next(res.choices[0].id);
console.log(res.node.node.title); // "Prepare for Battle"
console.log(res.choices.map((c) => c.label)); // e.g., ["Find a sword first"] (fight disabled until hasSword)

// Step 3: choose to find a sword
res = await engine.next('find-sword'); // use the choice id (outlet id)
console.log(res.node.node.title); // "Village Armory"
console.log(res.state.flags); // { hasSword: true }

// Step 4: go back to decision, now "Fight" becomes available
res = await engine.next('back-to-decision');
console.log(res.node.node.title); // "Prepare for Battle"
console.log(res.choices.map((c) => c.label)); // ["Fight the dragon"]

// Step 5: fight and finish
res = await engine.next('fight-now');
console.log(res.node.node.title); // "Dragon Lair"
res = await engine.next('end-victory');
console.log(res.node.node.title); // "Victory"
console.log(res.isComplete); // true
```

## Key concepts

- State is persisted and used to auto-select paths when conditions are met
- CEL expressions can be used in rules and conditions
- Works with multiple input formats via adapters (e.g., Mermaid)

## Execution model

- Engine: `new FlowEngine(flow, options?)`
- Start and step:
  - `await engine.start()` → returns `ExecutionResult`
  - `await engine.next(choiceId?)` → advance via a selected outlet id
- Result shape matches `ExecutionResult`:
  - `node` is an `AnnotatedNode` → access node via `res.node.node`
  - `choices` are available outlets with labels and `outletId`
  - `state` is the current state snapshot
  - `isComplete` indicates arrival at an inferred `end` node

## Data model (types)

From `src/types/flow-types.ts`:

```ts
export interface FlowDefinition {
  id: string;
  title: string;
  description?: string;
  expressionLanguage?: 'cel';
  globalState?: Record<string, unknown>;
  stateSchema?: JSONSchema7; // optional JSON Schema validation
  afterStateChangeRules?: StateRule[]; // optional rule engine
  autoAdvance?: 'always' | 'default' | 'never';
  metadata?: Record<string, unknown>;
  nodes: NodeDefinition[];
  startNodeId: string;
}

export interface NodeDefinition {
  id: string;
  title: string;
  content?: string; // supports ${...} interpolation
  actions?: StateAction[]; // executed on node enter
  outlets?: OutletDefinition[]; // edges
  autoAdvance?: 'always' | 'default' | 'never';
  metadata?: Record<string, unknown>;
}

export interface OutletDefinition {
  id: string; // used as choiceId
  to: string; // target node id
  label?: string;
  condition?: string; // CEL by default
  actions?: StateAction[]; // executed when traversed
  metadata?: Record<string, unknown>;
}

export interface StateAction {
  type: 'set';
  target: string; // e.g., flags.hasSword
  expression?: string; // e.g., true
}
```

## Choices and disabled states

`res.choices` are derived from the current node's outlets:

- When `options.showDisabledChoices` is `false` (default), only enabled outlets appear.
- When `true`, disabled choices include `disabled: true` and `disabledReason`.
- Single enabled outlet may be labeled "Continue" and include a helpful description.

Access the outlets via choice ids:

```ts
const choices = res.choices; // Choice[]
await engine.next(choices[0].id); // id equals outlet id
```

## Auto-advance

Control via node, flow, or engine options (`autoAdvance: 'always' | 'default' | 'never'`):

- `always`: engine selects the first matching conditional outlet (if/else logic),
  otherwise the default outlet (without condition).
- `default` (and `never` for decisions): no automatic transition from decision nodes.

## Events

Engine emits typed events (see `src/types/execution-types.ts`):

```ts
engine.on('nodeEnter', ({ node, state }) => {
  /* ... */
});
engine.on('nodeExit', ({ node, choice, state }) => {
  /* ... */
});
engine.on('stateChange', ({ oldState, newState }) => {
  /* ... */
});
engine.on('autoAdvance', ({ from, to, condition }) => {
  /* ... */
});
engine.on('complete', ({ history, finalState }) => {
  /* ... */
});
engine.on('error', ({ error, context }) => {
  /* ... */
});
```

## Interpolation in titles and content

Content supports `${...}` expressions evaluated against the current state
via the content interpolator. Escape with `\${...}` to render literally.

```ts
// Example content
content: 'You confront the dragon with your ${flags.hasSword ? "shiny sword" : "bare hands"}.';
```

## History and state APIs

- `engine.getCurrentNode()` → `AnnotatedNode | null`
- `engine.getHistory()` → `ExecutionStep[]` (includes `state` snapshots)
- `engine.getAvailableChoices()` → `Choice[]`
- `engine.getState()` → current state
- `engine.canGoBack()` / `engine.goBack()`
- `engine.reset()` → reset to `globalState`
