# ZFlo - Flow Execution Engine

A UI-agnostic flow execution engine for building stateful, rule-driven applications. Written in TypeScript, ZFlo provides a flexible framework for powering interactive experiences on any platform.

## Key Technical Features

- **UI-Agnostic Core**: The `@zflo/core` engine is pure TypeScript with zero UI dependencies, enabling use in web, mobile (React Native), and server-side environments.
- **Event-Driven Architecture**: The `FlowEngine` is an `EventEmitter`, making it easy to subscribe to state changes and integrate with any UI framework.
- **Stateful & Rule-Based**: A powerful `StateManager` tracks persistent state and uses a CEL-based rule engine to control flow logic, evaluate conditions, and trigger automatic transitions.
- **Headless React Hooks**: The `@zflo/react` package provides headless hooks (`useFlowEngine`) for a flexible, bring-your-own-UI approach in React applications.
- **Pluggable Data Formats**: Easily extend ZFlo to support various flowchart or diagramming languages. Includes out-of-the-box support for Mermaid and Graphviz DOT.

## Architecture

This is a TypeScript monorepo using pnpm workspaces. Key packages include:

- **`@zflo/core`**: The heart of the system. A UI-agnostic engine that manages flow execution, state, and rule evaluation. It's an `EventEmitter`, making it easy to integrate anywhere.
- **`@zflo/react`**: Provides headless React hooks (`useFlowEngine`) for building custom UIs in React and React Native. It manages the engine instance and exposes its state and methods.
- **`@zflo/react-web`**: A reference implementation of web-specific React components that use the headless hooks. Useful for rapid prototyping or as a guide for your own components.
- **`@zflo/ui-react-tw`**: A shared library of styled UI components (based on shadcn/ui) used by the demo app.
- **`@zflo/format-*`**: Pluggable modules for parsing different data formats (`-mermaid`, `-dot`) into the core ZFlo data structure.

Integration packages:

- **`@zflo/integ-telegram`**: Telegram bot integration for ZFlo.

Applications:

- **`@zflo/play`**: A demo and showcase of ZFlo features.
- **`@zflo/editor`**: A node-based flow editor for ZFlo.
- **`@zflo/telegram-bot`**: A Telegram bot that accepts ZFlo flows as its interaction logic.

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Documentation

- [Core Concepts](./docs/core-concepts.md)
- [Data Format](./docs/data-format.md)
- [API Reference](./docs/api-reference.md)
- [Examples](./docs/examples.md)

## License

MIT
