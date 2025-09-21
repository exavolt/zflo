# Core Concepts

## Expert System Foundation

ZFlo is an expert system that transforms static flowcharts into intelligent, state-aware interactive experiences. The system maintains knowledge about user actions and automatically makes decisions based on accumulated state.

## Flowchart Execution Model

ZFlo transforms static flowcharts into interactive experiences through an execution model that processes nodes sequentially while maintaining persistent state.

### Node Types

- **Start Node**: Entry point of the flowchart
- **Action Node**: Displays content or performs an action (can modify state)
- **Decision Node**: Presents choices to the user or auto-selects based on state
- **Condition Node**: Automatically evaluates state and branches accordingly
- **End Node**: Terminal point of execution

### Execution Flow

1. **Initialize**: Load and parse the flowchart into ZFlo data format
2. **Start**: Begin execution at the start node
3. **Process**: Display current node content
4. **Branch**: If decision node, present choices and wait for user input
5. **Advance**: Move to next node based on path or user choice
6. **Repeat**: Continue until reaching an end node

## State Management

The execution engine maintains:

- **Current Node**: The active node being displayed
- **Execution History**: Path taken through the flowchart
- **User Choices**: Decisions made at branching points
- **Global State**: Persistent variables (e.g., `hasSword: true`, `health: 75`)
- **Context Variables**: Dynamic data that can influence flow
- **Rule Engine**: Evaluates conditions and triggers automatic transitions

### State Examples

```typescript
// State can include any data
const gameState = {
  inventory: ['sword', 'potion'],
  health: 100,
  location: 'forest',
  questsCompleted: ['tutorial'],
  flags: {
    metWizard: true,
    hasKey: false,
  },
};
```

## Immersive Experience

The core principle is **progressive disclosure** - users see only the current step, creating:

- **Focus**: Attention on current decision/content
- **Suspense**: Unknown outcomes build engagement
- **Interactivity**: Active participation rather than passive viewing

## Expert System Features

### Rule-Based Decision Making

```typescript
// Automatic path selection based on state
if (state.inventory.includes('sword') && state.health > 50) {
  // Automatically take the "fight dragon" path
  engine.autoAdvance('fight-dragon');
}
```

### Conditional Branching

- **Manual Choices**: User explicitly selects from available options
- **Automatic Progression**: System selects path based on state conditions using if-else logic
- **Mixed Mode**: Some branches auto-select, others require user input

#### Auto-Advance If-Else Logic

Auto-advance nodes evaluate their outlets using if-else semantics:

1. **Conditional Outlets (if/else-if)**: Evaluated in order, first matching condition wins
2. **Default Outlet (else)**: Used when no conditional paths match
3. **Outlet Structure**: Must follow proper if-else patterns for predictable behavior

```typescript
// Example auto-advance node with if-else paths
{
  id: 'health-check',
  autoAdvance: 'always',
  outlets: [
    { to: 'hospital', condition: 'health <= 20' },     // if
    { to: 'rest', condition: 'health <= 50' },         // else if
    { to: 'adventure' }                                 // else (default)
  ]
}
```

The system validates auto-advance nodes to ensure:

- At most one default outlet (else clause)
- No unreachable outlets after always-true conditions
- Proper outlet ordering for clarity

## Expression Language

ZFlo uses the CEL expression language by default for all conditions and rules.

- **Default**: CEL (Common Expression Language)
- **Membership**: Use the `in` operator, e.g., `"sword" in inventory`

Examples of CEL conditions you might use in flows:

```text
"sword" in inventory && health > 50
flags.hasKey == true
level >= 3 || "potion" in inventory
```

### Stateless Evaluators and Defaults

Expressions are evaluated by stateless evaluators. The current execution state is passed as context on each call. The default language is CEL, configurable per flow via `flowchart.expressionLanguage`.

## String Interpolation

ZFlo supports dynamic content through string interpolation using `${expression}` syntax. This allows node content to display current state values and computed expressions.

### Basic Variable Interpolation

```typescript
// Node content with state variables
{
  id: 'status',
  content: 'Your health is ${health} and you have ${gold} gold coins.',
  // With state: { health: 85, gold: 150 }
  // Displays: "Your health is 85 and you have 150 gold coins."
}
```

### Expression Interpolation

```typescript
// Complex expressions in content
{
  id: 'temperature',
  content: 'Brew at ${currentTemp}°C. Range: ${highTemp - lowTemp}°C wide. Mid-point: ${(highTemp + lowTemp) / 2}°C',
  // With state: { currentTemp: 90, highTemp: 100, lowTemp: 80 }
  // Displays: "Brew at 90°C. Range: 20°C wide. Mid-point: 90°C"
}
```

### Dynamic Content Updates

String interpolation is evaluated each time a node is displayed, so content automatically reflects current state:

```typescript
// Content updates when state changes
const engine = new FlowEngine(flow);
await engine.start(); // Shows current values

engine.getStateManager().setState({ temperature: 95 });
const currentNode = engine.getCurrentNode(); // Shows updated values
```

### Supported Value Types

- **Numbers**: Automatically formatted (floats rounded to 2 decimal places)
- **Strings**: Displayed as-is, support string concatenation
- **Booleans**: Displayed as "true" or "false"
- **Arrays**: Displayed as comma-separated values
- **Objects**: Basic string representation

### Error Handling

- **Missing Variables**: Display as empty string with warning logged
- **Invalid Expressions**: Display as empty string with error logged
- **Graceful Degradation**: Content still displays with interpolation errors

## Format Agnostic Design

The core engine works with a normalized internal format, allowing support for multiple input formats through adapters:

- **Mermaid Adapter**: Converts Mermaid flowcharts with state conditions
- **Custom Format**: Native ZFlo format for advanced expert system features
- **Extensible**: Plugin system for additional formats
