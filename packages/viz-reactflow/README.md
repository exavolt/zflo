# @zflo/viz-reactflow

React Flow visualization components for ZFlo flows.

## Features

- **React Flow Integration**: Built on top of React Flow v12 (`@xyflow/react`) for smooth, interactive flow visualization
- **Dagre Layout**: Automatic graph layout using Dagre algorithm for optimal node positioning
- **Handleless Nodes**: Clean node design without visible connection handles for better aesthetics
- **Arrow Markers**: Edges display directional arrows showing flow direction
- **Content Truncation**: Long node contents are automatically truncated to keep node sizes consistent
- **Outlet Labels**: Flow outlets are displayed as edge labels for clear navigation paths
- **Current Node Highlighting**: Visual emphasis on the currently active node
- **Traversal Indicators**: Shows which nodes and edges have been traversed in the flow execution
- **Auto Viewport**: Automatically pans and zooms to focus on the current node
- **Responsive Design**: Adapts to different container sizes and screen resolutions
- **Configurable Layout**: Customizable layout direction, spacing, and margins

## Installation

```bash
pnpm add @zflo/viz-reactflow @xyflow/react dagre
```

**Note**: This package requires `@xyflow/react` v12+ and `dagre` as peer dependencies.

## Usage

### Basic Usage

```tsx
import { FlowViz } from '@zflo/viz-reactflow';
import { useFlowEngine } from '@zflo/react';

function MyFlowVisualization() {
  const { currentNode, history } = useFlowEngine(myFlow);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <FlowViz
        flow={myFlow}
        currentNodeId={currentNode?.node.id}
        history={history}
        onNodeClick={(nodeId) => console.log('Node clicked:', nodeId)}
      />
    </div>
  );
}
```

### Advanced Usage with Custom Layout Options

```tsx
import { FlowViz } from '@zflo/viz-reactflow';

function AdvancedFlowVisualization() {
  return (
    <FlowViz
      flow={myFlow}
      currentNodeId={currentNodeId}
      history={executionHistory}
      maxContentLength={150}
      fitViewOnCurrentNode={true}
      onNodeClick={handleNodeClick}
      onEdgeClick={handleEdgeClick}
      className="my-flow-viz"
      style={{ border: '1px solid #ccc' }}
      layoutOptions={{
        direction: 'LR', // Left to Right layout
        nodeSpacing: 100,
        rankSpacing: 150,
        marginX: 50,
        marginY: 50,
      }}
    />
  );
}
```

### Using the Hook

```tsx
import { useFlowViz } from '@zflo/viz-reactflow';
import { ReactFlow } from '@reactflow/core';

function CustomFlowVisualization() {
  const { nodes, edges } = useFlowViz(myFlow, currentNodeId, history, {
    maxContentLength: 120,
    layoutOptions: {
      direction: 'LR',
      nodeSpacing: 200,
    },
  });

  return <ReactFlow nodes={nodes} edges={edges} />;
}
```

## API Reference

### FlowViz Props

| Prop                   | Type                       | Default | Description                                       |
| ---------------------- | -------------------------- | ------- | ------------------------------------------------- |
| `flow`                 | `FlowDefinition`           | -       | The ZFlo flow to visualize                        |
| `currentNodeId`        | `string`                   | -       | ID of the currently active node                   |
| `history`              | `ExecutionStep[]`          | `[]`    | Execution history for traversal indicators        |
| `onNodeClick`          | `(nodeId: string) => void` | -       | Callback when a node is clicked                   |
| `onEdgeClick`          | `(edgeId: string) => void` | -       | Callback when an edge is clicked                  |
| `maxContentLength`     | `number`                   | `100`   | Maximum length for node content before truncation |
| `fitViewOnCurrentNode` | `boolean`                  | `true`  | Auto-fit viewport to current node                 |
| `className`            | `string`                   | -       | CSS class for the container                       |
| `style`                | `CSSProperties`            | -       | Inline styles for the container                   |

### useFlowViz Hook

```tsx
function useFlowViz(
  flow: FlowDefinition,
  currentNodeId?: string,
  history?: ExecutionStep[],
  options?: UseFlowVizOptions
): UseFlowVizReturn;
```

#### Options

| Option             | Type                | Default | Description                              |
| ------------------ | ------------------- | ------- | ---------------------------------------- |
| `maxContentLength` | `number`            | `100`   | Maximum content length before truncation |
| `layoutOptions`    | `FlowLayoutOptions` | -       | Layout configuration options             |

#### Returns

| Property           | Type            | Description                              |
| ------------------ | --------------- | ---------------------------------------- |
| `nodes`            | `FlowVizNode[]` | React Flow nodes with visualization data |
| `edges`            | `FlowVizEdge[]` | React Flow edges with outlet labels      |
| `traversedNodeIds` | `Set<string>`   | Set of traversed node IDs                |
| `traversedEdgeIds` | `Set<string>`   | Set of traversed edge IDs                |

## Styling

The component uses a default theme but can be customized through CSS classes:

```css
.my-flow-viz .react-flow__node {
  /* Custom node styles */
}

.my-flow-viz .react-flow__edge {
  /* Custom edge styles */
}
```

## Dependencies

- React 19+
- @reactflow/core
- @zflo/core
- @zflo/react

## License

MIT
