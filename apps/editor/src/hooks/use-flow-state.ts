import { useState, useCallback, useMemo } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import { ZFFlow, ZFNode, inferNodeTypes } from '@zflo/core';
import { v4 as uuidv4 } from 'uuid';
import { convertZFloToReactFlow } from '../lib/converters/zflo-to-reactflow';
import { convertReactFlowToZFlo } from '../lib/converters/reactflow-to-zflo';
import {
  ZFReactFlowNode,
  ZFReactFlowEdge,
} from '../lib/converters/zflo-to-reactflow';

export function useFlowState(initialFlow?: ZFFlow) {
  const [flowMetadata, setFlowMetadata] = useState<Partial<ZFFlow>>({
    id: initialFlow?.id || uuidv4(),
    title: initialFlow?.title || 'New Flow',
    description: initialFlow?.description,
    globalState: initialFlow?.globalState || {},
    stateRules: initialFlow?.stateRules || [],
    autoAdvance: initialFlow?.autoAdvance || 'default',
    expressionLanguage: initialFlow?.expressionLanguage || 'cel',
  });

  const initialData = useMemo(() => {
    if (initialFlow) {
      return convertZFloToReactFlow(initialFlow);
    }
    return { nodes: [], edges: [] };
  }, [initialFlow]);

  const [nodes, setNodes, onNodesChange] = useNodesState<ZFReactFlowNode>(
    initialData.nodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<ZFReactFlowEdge>(
    initialData.edges
  );

  // Calculate dynamic node types based on current connections
  const nodeTypes = useMemo(() => {
    const zfloNodes = nodes.map((node) => node.data.zfloNode);
    return inferNodeTypes(zfloNodes);
  }, [nodes, edges]);

  // Update node data when connections change
  const updateNodeTypes = useCallback(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const outputCount = edges.filter(
          (edge) => edge.source === node.id
        ).length;

        return {
          ...node,
          data: {
            ...node.data,
            outputCount,
          },
        };
      })
    );
  }, [edges, setNodes]);

  // Update node content
  const updateNode = useCallback(
    (nodeId: string, updates: Partial<ZFNode>) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                zfloNode: {
                  ...node.data.zfloNode,
                  ...updates,
                },
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Update edge/path data
  const updateEdge = useCallback(
    (edgeId: string, updates: { label?: string; condition?: string }) => {
      setEdges((currentEdges) =>
        currentEdges.map((edge) => {
          if (edge.id === edgeId) {
            return {
              ...edge,
              data: {
                ...edge.data,
                ...updates,
              },
              label: updates.label || edge.label,
            };
          }
          return edge;
        })
      );

      // Also update the corresponding path in the source node
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const edge = edges.find((e) => e.id === edgeId);
          if (edge && node.id === edge.source) {
            return {
              ...node,
              data: {
                ...node.data,
                zfloNode: {
                  ...node.data.zfloNode,
                  outlets:
                    node.data.zfloNode.outlets?.map((path) => {
                      if (path.id === edge.data.pathId) {
                        return {
                          ...path,
                          label: updates.label || path.label,
                          condition: updates.condition || path.condition,
                        };
                      }
                      return path;
                    }) || [],
                },
              },
            };
          }
          return node;
        })
      );
    },
    [setEdges, setNodes, edges]
  );

  // Convert current state to ZFlo format
  const toZFFlow = useCallback((): ZFFlow => {
    return convertReactFlowToZFlo(
      nodes,
      edges,
      flowMetadata.title || 'Untitled Flow',
      flowMetadata
    );
  }, [nodes, edges, flowMetadata]);

  // Load ZFlo flow
  const loadFlow = useCallback(
    (flow: ZFFlow) => {
      const { nodes: newNodes, edges: newEdges } = convertZFloToReactFlow(flow);
      setNodes(newNodes);
      setEdges(newEdges);
      setFlowMetadata({
        id: flow.id,
        title: flow.title,
        description: flow.description,
        globalState: flow.globalState,
        stateRules: flow.stateRules,
        autoAdvance: flow.autoAdvance,
        expressionLanguage: flow.expressionLanguage,
      });
    },
    [setNodes, setEdges]
  );

  return {
    nodes,
    edges,
    nodeTypes,
    flowMetadata,
    onNodesChange,
    onEdgesChange,
    updateNode,
    updateEdge,
    updateNodeTypes,
    toZFFlow,
    loadFlow,
    setFlowMetadata,
  };
}
