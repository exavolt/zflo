# Architecture

## System Overview

ZFlo is designed as a modular system with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer      │    │   Format        │    │   Extensions    │
│                 │    │   Parsers       │    │                 │
│ • @zflo/react   │    │                 │    │ • Themes        │
│ • @zflo/rn      │    │ • Mermaid       │    │ • Plugins       │
│ • Custom UIs    │    │ • PlantUML      │    │ • Validators    │
└─────────────────┘    │ • Custom        │    └─────────────────┘
         │              └─────────────────┘             │
         │                       │                      │
         └───────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   @zflo/core     │
                    │                 │
                    │ • Engine        │
                    │ • State Mgmt    │
                    │ • Event System  │
                    │ • Data Format   │
                    └─────────────────┘
```

## Expression Evaluation

Expressions are evaluated by stateless evaluators in `@zflo/core`.

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

- Default evaluator: `CelEvaluator` (CEL – Common Expression Language)

Selection hierarchy:

- Flow-level default via `flowchart.expressionLanguage` ('cel')

Where evaluation happens:

- `StateManager.evaluateCondition(expression: string)`
  - Parses the prefix (if any) and chooses the evaluator
  - Passes current state as context to `evaluate`

Performance notes:

- `CelEvaluator` caches parse results keyed by expression for reuse
- Non-boolean results are coerced to boolean
- Errors are surfaced via `onError` option and treated as false

## Core Principles

### 1. UI Agnostic Core

The `@zflo/core` package contains all business logic without UI dependencies:

- Flowchart execution engine
- State management
- Event system
- Data format definitions

### 2. Format Extensibility

Support multiple input formats through adapter pattern:

- Built-in Mermaid support
- Plugin system for additional formats
- Validation and error handling

### 3. Progressive Enhancement

Start simple, add complexity as needed:

- Basic linear flows
- Conditional branching
- Dynamic content
- Complex state management

## Data Flow

### 1. Input Processing

```
Mermaid Code → Parser → Validation → ZFlo Format
```

### 2. Execution Flow

```
Start Node → Engine → Current State → UI Render → User Input → Next State
```

### 3. State Management

```
┌─────────────────┐
│ ExecutionState  │
├─────────────────┤
│ • currentNode   │
│ • history       │
│ • variables     │
│ • choices       │
└─────────────────┘
```

## Event System

The engine uses an event-driven architecture:

```typescript
type EngineEvents = {
  'node:enter': { node: ZFNode; context: ExecutionContext };
  'node:exit': { node: ZFNode; choice?: string };
  'flow:complete': { history: ExecutionStep[] };
  'flow:error': { error: Error; context: ExecutionContext };
  'choice:made': { choice: string; from: string; to: string };
};
```

## Performance Considerations

### Memory Management

- Lazy loading of large flows
- Efficient history tracking
- Garbage collection of unused nodes
- LRU caching for expensive graph operations

### Rendering Optimization

- Virtual scrolling for long content
- Memoized components
- Optimistic updates
- Cached reachability analysis and node depth calculations

### Bundle Size

- Tree-shakable exports
- Optional features as separate imports
- Minimal dependencies
- Singleton evaluator instances to reduce object creation

### Performance Optimizations

- **FlowGraphUtils**: Cached graph traversal operations with LRU cache
- **StateActionExecutor**: Shared execution logic eliminates duplication
- **EvaluatorFactory**: Singleton pattern for expression evaluators
- **Batch Processing**: Utilities for handling large datasets efficiently

## Security

### Input Validation

- Sanitize user-provided flowchart content
- Validate against schema
- Prevent XSS in dynamic content

### Execution Safety

- Sandboxed expression evaluation
- Timeout protection for infinite loops
- Memory limits for large flows
- Comprehensive error handling with standardized error codes
- Type guards and runtime validation
- Safe execution wrappers for critical operations

## Error Handling & Type Safety

### Standardized Error Handling

- **ZFloErrorHandler**: Centralized error handling with context and logging
- **Error Codes**: Comprehensive error classification system
- **Safe Execution**: Wrappers for async and sync operations with fallbacks
- **Context-Aware Errors**: Rich error objects with debugging information

### Type Safety Improvements

- **Type Guards**: Runtime validation for ZFlo objects and data types
- **Strict Typing**: Elimination of `any` types and non-null assertions
- **Validation Utilities**: Comprehensive type checking and assertion functions
- **Runtime Safety**: Type validation at critical execution points

## Extensibility Points

### Custom Node Types

```typescript
interface CustomNodeType {
  type: string;
  renderer: NodeRenderer;
  validator: NodeValidator;
  executor: NodeExecutor;
}
```

### Format Parsers

```typescript
interface FormatParser {
  name: string;
  extensions: string[];
  parse: (input: string) => ZFFlow;
  validate: (input: string) => ValidationResult;
}
```

### Themes

```typescript
interface Theme {
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  animations: Animations;
}
```
