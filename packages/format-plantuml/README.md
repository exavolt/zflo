# @zflo/format-plantuml

PlantUML Activity diagram format support for ZFlo. This package provides parsing capabilities for PlantUML Activity diagrams, converting them into ZFlo flowcharts for immersive interactive experiences.

## Features

- Parse PlantUML Activity diagrams into ZFlo format
- Support for standard PlantUML Activity syntax
- Decision points and branching logic
- Start and end activities
- Conditional flows and labels

## Installation

```bash
pnpm add @zflo/format-plantuml
```

## Usage

```typescript
import { PlantUMLParser } from '@zflo/format-plantuml';

const parser = new PlantUMLParser();
const plantUMLCode = `
@startuml
start
:Welcome to the adventure;
if (Choose your path?) then (cave)
  :Explore the dark cave;
  :Find treasure!;
else (mountain)
  :Climb the mountain;
  :Enjoy the view!;
endif
:Victory!;
stop
@enduml
`;

const flow = parser.parse(plantUMLCode);
```

## Supported PlantUML Activity Syntax

- `@startuml` / `@enduml` - Activity diagram boundaries
- `start` / `stop` - Start and end points
- `:Activity;` - Action activities
- `if (condition?) then (label)` / `else (label)` / `endif` - Decision points
- `->` - Flow connections
- Activity labels and descriptions

## License

MIT
