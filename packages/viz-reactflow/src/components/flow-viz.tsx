import React, { useMemo, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useReactFlow,
  MarkerType,
  type NodeTypes,
  type EdgeTypes,
  type DefaultEdgeOptions,
  EdgeMarkerType,
} from '@xyflow/react';
import { FlowVizNode } from './flow-viz-node';
import { FlowVizEdge } from './flow-viz-edge';
import { convertFlowToReactFlow } from '../utils/flow-layout';
import type { FlowVizProps } from '../types/flowviz-types';

const nodeTypes: NodeTypes = {
  flowVizNode: FlowVizNode,
};

const edgeTypes: EdgeTypes = {
  flowVizEdge: FlowVizEdge,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'flowVizEdge',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#6b7280',
    width: 20,
    height: 20,
  } as DefaultEdgeOptions['markerEnd'],
};

function FlowVizInner({
  flow,
  currentNodeId,
  history = [],
  onNodeClick,
  onEdgeClick,
  maxContentLength = 100,
  fitViewOnCurrentNode = true,
  layoutOptions,
  className,
  style,
}: FlowVizProps) {
  const { fitView, getNode } = useReactFlow();

  const { nodes, edges } = useMemo(() => {
    return convertFlowToReactFlow(
      flow,
      currentNodeId,
      history,
      maxContentLength,
      layoutOptions
    );
  }, [flow, currentNodeId, history, maxContentLength, layoutOptions]);

  const edgesWithMarkers = useMemo(() => {
    return edges.map((edge) => {
      return {
        ...edge,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6b7280',
          width: 20,
          height: 20,
        } as EdgeMarkerType,
      };
    });
  }, [edges]);

  // Auto-fit viewport to current node
  useEffect(() => {
    if (fitViewOnCurrentNode && currentNodeId) {
      const currentNode = getNode(currentNodeId);
      if (currentNode) {
        // Fit view with some padding around the current node
        // We need to use requestAnimationFrame for the changes to take effect
        requestAnimationFrame(() => {
          fitView({
            nodes: [currentNode],
            padding: 0.3,
            duration: 600,
          });
        });
      }
    }
  }, [currentNodeId, fitViewOnCurrentNode, fitView, getNode]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: any) => {
      event.stopPropagation();
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event.stopPropagation();
      if (onEdgeClick) {
        onEdgeClick(edge.id);
      }
    },
    [onEdgeClick]
  );

  return (
    <div
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edgesWithMarkers}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        fitView
        fitViewOptions={{
          padding: 0.1,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export function FlowViz(props: FlowVizProps) {
  return (
    <ReactFlowProvider>
      <FlowVizInner {...props} />
    </ReactFlowProvider>
  );
}
