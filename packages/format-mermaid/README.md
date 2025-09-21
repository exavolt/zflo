# @zflo/format-mermaid

Mermaid format support for ZFlo (parser and exporter).

## Install

```bash
pnpm add @zflo/format-mermaid
```

## Usage

```ts
import { MermaidParser, zfloToMermaid } from '@zflo/format-mermaid';

const mermaid = `
flowchart TD
  A[Start] --> B{Choose}
  B -->|Yes| C[Success]
  B -->|No| D[Failure]
`;

const parser = new MermaidParser();
const flow = parser.parse(mermaid);

// Convert ZFlo flow back to Mermaid (optional)
const back = zfloToMermaid(flow);
```
