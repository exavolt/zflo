# @zflo/format-dot

Graphviz DOT format support for ZFlo.

## Install

```bash
pnpm add @zflo/format-dot
```

## Usage

```ts
import { DotParser } from '@zflo/format-dot';

const dot = `
digraph G {
  start -> end;
}`;

const parser = new DotParser();
const flow = parser.parse(dot);
```
