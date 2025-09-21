# @zflo/react

Headless React hooks for ZFlo (works in React and React Native).

## Install

```bash
pnpm add @zflo/react @zflo/core
```

## Usage

```tsx
import { useFlowEngine, type ZFFlow } from '@zflo/react';

export function FlowRunner({ flow }: { flow: ZFFlow }) {
  const { currentNode, choices, isComplete, makeChoice, reset } =
    useFlowEngine(flow);

  if (isComplete) return <button onClick={reset}>Restart</button>;

  return (
    <div>
      <h2>{currentNode?.title}</h2>
      <p>{currentNode?.content}</p>
      <div>
        {choices.map((c) => (
          <button key={c.id} onClick={() => makeChoice(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```
