# @zflo/react-web

Web-specific React components for ZFlo (DOM-based UI).

## Install

```bash
pnpm add @zflo/react-web @zflo/react @zflo/core
```

## Usage

```tsx
import { FlowPlayer } from '@zflo/react-web';
import type { FlowDefinition } from '@zflo/core';

export function App({ flow }: { flow: FlowDefinition }) {
  return (
    <FlowPlayer
      flowchart={flow}
      onComplete={(history) => console.log('Done', history)}
    />
  );
}
```
