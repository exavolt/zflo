import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  Connection,
  useReactFlow,
  FinalConnectionState,
  MarkerType,
  MiniMap,
  DefaultEdgeOptions,
} from '@xyflow/react';
import {
  Play,
  Trash2,
  Settings,
  MoreHorizontal,
  Download,
  Code,
  CopyIcon,
  CloudUploadIcon,
  CloudDownloadIcon,
  Share2,
  Moon,
  Sun,
  HelpCircle,
} from 'lucide-react';
import { ZEdNode } from './zed-node';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { convertReactFlowToZFlo } from '@/lib/converters/reactflow-to-zflo';
import { FlowPlayer } from '@zflo/ui-react-tw';
import { FlowMetadataEditor } from './flow-metadata-editor';
import { FlowSwitcher } from './flow-switcher';
import { FlowShareDialog } from '../flow/flow-share-dialog';
import { ManageSharedFlowsDialog } from '../flow/manage-shared-flows-dialog';
import { SaveFlowDialog } from './save-flow-dialog';
import { LoadFlowsDialog } from './load-flows-dialog';
import type { FlowMetadata } from '@zflo/core';
import type { UserFlow } from '@zflo/platform-core';
import { useTheme } from '@/lib/use-theme';
import {
  OnboardingDialog,
  useOnboarding,
} from '../onboarding/onboarding-dialog';
import { v4 as uuidv4 } from 'uuid';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';
import { toast } from 'sonner';
import { EditorData, NodeData } from '@/types';
import { useGlobalNodeEditor } from '@/hooks/use-global-node-editor';
import { NodeEditor } from './node-editor';
import { NodeEditorProvider } from '@/contexts/node-editor-context';
import { useUnifiedPersistence } from '@/hooks/use-unified-persistence';

const nodeTypes = {
  zfloNode: ZEdNode,
};

const defaultEdgeMarkerEnd = {
  type: MarkerType.ArrowClosed,
  width: 20,
  height: 20,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  markerEnd: defaultEdgeMarkerEnd,
};

export function FlowEditor() {
  const { theme, toggleTheme } = useTheme();
  const globalNodeEditor = useGlobalNodeEditor();
  const { showOnboarding, openOnboarding, closeOnboarding } = useOnboarding();

  // Multi-flow persistence
  const {
    isLoading: isLoadingFlows,
    activeFlowId,
    getActiveFlow,
    getAllFlows,
    saveFlowState,
    createFlow,
    deleteFlow,
    switchToFlow,
  } = useUnifiedPersistence();

  // Get current active flow or use defaults (memoized to prevent infinite loops)
  const defaultNodes: Node[] = useMemo(
    () => [
      {
        id: 'zflo-n1',
        type: 'zfloNode',
        position: { x: 100, y: 100 },
        data: {
          title: 'Start',
          content: '',
          outputCount: 0,
          outlets: [],
        } as NodeData as unknown as Record<string, unknown>,
      },
    ],
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [flowTitle, setFlowTitle] = useState('New Flow');

  // Sheet state management - only one sheet can be open at a time
  const [activeSheet, setActiveSheet] = useState<'metadata' | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isViewCodeOpen, setIsViewCodeOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isManageSharedFlowsOpen, setIsManageSharedFlowsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [currentSavedFlowId, setCurrentSavedFlowId] = useState<string | null>(
    null
  );

  // Handle opening the view code dialog
  const handleViewCodeClick = useCallback(() => {
    setIsViewCodeOpen(true);
    setIsPreviewOpen(false);
    setIsDropdownOpen(false);
  }, []);

  // Flow metadata state
  const [flowMetadata, setFlowMetadata] = useState<FlowMetadata>({
    id: uuidv4(),
    title: 'New Flow',
    description: '',
    expressionLanguage: 'cel',
    initialState: {},
    stateSchema: undefined,
    metadata: {},
  });

  const nodeIdSourceRef = useRef(1);
  const edgeIdSourceRef = useRef(1);

  const { screenToFlowPosition } = useReactFlow();

  const nextNodeId = useCallback(() => {
    nodeIdSourceRef.current++;
    return nodeIdSourceRef.current;
  }, []);

  const nextEdgeId = useCallback(() => {
    edgeIdSourceRef.current++;
    return edgeIdSourceRef.current;
  }, []);

  // Track if we're currently loading a flow to prevent auto-save during load
  const isLoadingFlowRef = useRef(false);

  // Create a stable reference to the current flow state for comparison
  const currentFlowState = useMemo(
    () => ({
      nodes,
      edges,
      flowTitle,
      nodeIdCounter: nodeIdSourceRef.current,
      edgeIdCounter: edgeIdSourceRef.current,
      flowMetadata,
    }),
    [nodes, edges, flowTitle, flowMetadata]
  );

  // Auto-save when state changes (but not during preview or loading)
  useEffect(() => {
    if (
      !activeFlowId ||
      isPreviewOpen ||
      isLoadingFlowRef.current ||
      isLoadingFlows
    )
      return;

    const timeoutId = setTimeout(() => {
      saveFlowState(currentFlowState);
    }, 1000); // Increased debounce to 1 second for better UX

    return () => clearTimeout(timeoutId);
  }, [
    currentFlowState,
    saveFlowState,
    activeFlowId,
    isPreviewOpen,
    isLoadingFlows,
  ]);

  // Update flow metadata when title changes
  useEffect(() => {
    setFlowMetadata((prev) => ({ ...prev, title: flowTitle }));
  }, [flowTitle]);

  // Update editor state when active flow changes
  useEffect(() => {
    if (isLoadingFlows) return; // Don't update during loading

    const activeFlow = getActiveFlow();

    if (activeFlow && activeFlowId) {
      // Set loading flag to prevent auto-save during state update
      isLoadingFlowRef.current = true;

      setNodes(activeFlow.nodes);
      setEdges(
        activeFlow.edges.map((edge) => ({
          ...edge,
          markerEnd: defaultEdgeMarkerEnd,
        }))
      );
      setFlowTitle(activeFlow.flowTitle);
      setFlowMetadata(
        activeFlow.flowMetadata || {
          id: uuidv4(),
          title: activeFlow.flowTitle,
          description: '',
          expressionLanguage: 'cel',
          initialState: {},
          stateSchema: undefined,
          metadata: {},
        }
      );
      nodeIdSourceRef.current = activeFlow.nodeIdCounter;
      edgeIdSourceRef.current = activeFlow.edgeIdCounter;

      // Clear loading flag after a short delay to allow state to settle
      setTimeout(() => {
        isLoadingFlowRef.current = false;
      }, 100);
    } else if (!activeFlowId) {
      // Reset to defaults when no active flow
      setNodes(defaultNodes);
      setEdges([]);
      setFlowTitle('New Flow');
      nodeIdSourceRef.current = 1;
      edgeIdSourceRef.current = 1;
    }
  }, [activeFlowId, isLoadingFlows]);

  // Clear current flow and reset to defaults
  const clearEditor = useCallback(() => {
    const newMetadata = {
      id: uuidv4(),
      title: 'New Flow',
      description: '',
      expressionLanguage: 'cel' as const,
      initialState: {},
      stateSchema: undefined,
      metadata: {},
    };

    setNodes(defaultNodes);
    setEdges([]);
    setFlowTitle('New Flow');
    nodeIdSourceRef.current = 1;
    edgeIdSourceRef.current = 1;
    setFlowMetadata(newMetadata);
    setActiveSheet(null);

    // Save the cleared state with force update
    if (activeFlowId) {
      saveFlowState(
        {
          nodes: defaultNodes,
          edges: [],
          flowTitle: 'New Flow',
          nodeIdCounter: 1,
          edgeIdCounter: 1,
          flowMetadata: newMetadata,
        },
        undefined,
        true
      ); // Force update since we're intentionally clearing
    }
  }, [setNodes, setEdges, defaultNodes, saveFlowState, activeFlowId]);

  const onConnect = useCallback(
    (conn: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...conn,
            id: `zflo-e${nextEdgeId()}`,
            markerEnd: defaultEdgeMarkerEnd,
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
      // when a connection is dropped on the pane it's not valid
      if (!connectionState.isValid) {
        // we need to remove the wrapper bounds, in order to get the correct position
        const edgeId = `zflo-e${nextEdgeId()}`;
        const touch =
          'changedTouches' in event ? event.changedTouches[0] : event;
        if (!touch) return;
        const { clientX, clientY } = touch;
        const nodeIdNum = nextNodeId();
        const nodeId = `zflo-n${nodeIdNum}`;
        const isIncoming = connectionState.fromHandle?.type === 'target';
        const projectedPosition = screenToFlowPosition({
          x: clientX,
          y: clientY,
        });
        const newNode: Node = {
          id: nodeId,
          position: isIncoming
            ? { x: projectedPosition.x - 200, y: projectedPosition.y - 47 }
            : { x: projectedPosition.x, y: projectedPosition.y - 20 },
          data: { title: `Node ${nodeIdNum}` } as NodeData as unknown as Record<
            string,
            unknown
          >,
          origin: [0.0, 0.0],
          type: 'zfloNode',
        };

        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) => {
          if (connectionState.fromNode) {
            if (isIncoming) {
              return eds.concat({
                id: edgeId,
                source: nodeId,
                sourceHandle: null,
                target: connectionState.fromNode.id,
                targetHandle: connectionState.fromHandle?.id,
                markerEnd: defaultEdgeMarkerEnd,
              });
            }
            return eds.concat({
              id: edgeId,
              source: connectionState.fromNode.id,
              sourceHandle: connectionState.fromHandle?.id,
              target: nodeId,
              targetHandle: null,
              markerEnd: defaultEdgeMarkerEnd,
            });
          } else {
            return eds.map((edge) => ({
              ...edge,
              markerEnd: defaultEdgeMarkerEnd,
            }));
          }
        });
      }
    },
    [screenToFlowPosition, nextNodeId, nextEdgeId]
  );

  const updateNodeTypes = useCallback(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          outputCount: edges.filter((edge) => edge.source === node.id).length,
        } as NodeData as unknown as Record<string, unknown>,
      }))
    );
  }, [nodes, edges, setNodes]);

  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<NodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
      );
      globalNodeEditor.updateNodeData(updates);
      // Note: Save will be triggered by the debounced save mechanism
    },
    [setNodes, globalNodeEditor]
  );

  // Update node types when edges change
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      setTimeout(updateNodeTypes, 0);
    },
    [onEdgesChange, updateNodeTypes]
  );

  const generateZFloFlow = useCallback(() => {
    const baseFlow = convertReactFlowToZFlo(nodes, edges, flowTitle);
    return {
      ...baseFlow,
      ...flowMetadata,
      title: flowTitle, // Ensure title stays in sync
    };
  }, [nodes, edges, flowTitle, flowMetadata]);

  const downloadFlow = useCallback(() => {
    const flow = convertReactFlowToZFlo(nodes, edges, flowTitle, flowMetadata);
    const dataStr = JSON.stringify(flow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${flowTitle.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [nodes, edges, flowTitle, flowMetadata]);

  // Prevent deletion of the last node
  const onBeforeDelete = (_params: {
    nodes: Node[];
    edges: Edge[];
  }): Promise<boolean | { nodes: Node[]; edges: Edge[] }> => {
    if (nodes.length === 1) {
      toast('Cannot delete the only node');
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* Header */}
      <header className="flex h-16 w-full items-center gap-2 border-b px-4 justify-between">
        <div className="flex items-center gap-4">
          <FlowSwitcher
            flows={getAllFlows().filter(
              (flow): flow is NonNullable<typeof flow> => flow !== undefined
            )}
            activeFlowId={activeFlowId}
            onSwitchFlow={switchToFlow}
            onCreateFlow={async (title: string) => {
              await createFlow(title);
            }}
            onDeleteFlow={deleteFlow}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveSheet('metadata')}
            className="flex items-center gap-2"
          >
            <Settings />
            Flow Settings
          </Button>
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Play />
                Playtest
              </Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>{flowTitle} (Playtest)</DialogTitle>
              </DialogHeader>
              <div className="overflow-auto flex-1 -mx-6 -mb-6 pb-6">
                {isPreviewOpen && (
                  <FlowPlayer
                    flow={generateZFloFlow()}
                    autoStart={false}
                    enableTypingAnimation={false}
                    typingSpeed={3}
                    className="w-full px-6"
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
                <Share2 />
                Create Play Link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsManageSharedFlowsOpen(true)}
              >
                <Settings />
                Manage Play Links
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsLoadDialogOpen(true)}>
                <CloudDownloadIcon />
                Load
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSaveDialogOpen(true)}>
                <CloudUploadIcon />
                Save
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem onClick={importFlow}>
                <Upload />
                Import Flow
              </DropdownMenuItem> */}
              <DropdownMenuItem onClick={downloadFlow}>
                <Download />
                Export Flow
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleViewCodeClick();
                }}
              >
                <Code />
                View Code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={clearEditor}
                className="text-destructive"
              >
                <Trash2 />
                Clear Flow
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'light' ? <Moon /> : <Sun />}
                Toggle Theme
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openOnboarding}>
                <HelpCircle />
                Getting Started
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        <NodeEditorProvider openEditor={globalNodeEditor.openEditor}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={handleEdgesChange}
            defaultEdgeOptions={defaultEdgeOptions}
            onConnect={onConnect}
            onConnectEnd={onConnectEnd}
            onBeforeDelete={onBeforeDelete}
            nodeTypes={nodeTypes}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            className="bg-muted/20"
            colorMode={theme === 'dark' ? 'dark' : 'light'}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </NodeEditorProvider>
      </div>

      {/* View Code Dialog */}
      <Dialog open={isViewCodeOpen} onOpenChange={setIsViewCodeOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>View Code</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <div className="max-h-[60vh] overflow-auto rounded-md">
              <Editor
                value={JSON.stringify(generateZFloFlow(), null, 2)}
                onValueChange={() => {}} // Read-only
                highlight={(code) =>
                  Prism.highlight(code, Prism.languages.json || {}, 'json')
                }
                padding={16}
                className="font-mono text-sm bg-muted"
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 14,
                }}
                readOnly
              />
            </div>
            <div className="absolute top-1 right-1 z-20">
              <Button
                variant="ghost"
                size="icon"
                className="p-1 bg-background"
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(generateZFloFlow(), null, 2)
                  );
                  toast('Copied to clipboard');
                }}
              >
                <CopyIcon />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Flow Dialog */}
      <SaveFlowDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        editorData={{
          nodes,
          edges,
          flowTitle,
          nodeIdCounter: nodeIdSourceRef.current,
          edgeIdCounter: edgeIdSourceRef.current,
          flowMetadata: {
            id: flowMetadata.id ?? uuidv4(),
            title: flowMetadata.title ?? flowTitle,
            description: flowMetadata.description,
            expressionLanguage: flowMetadata.expressionLanguage,
            initialState: flowMetadata.initialState,
            stateSchema: flowMetadata.stateSchema,
            afterStateChangeRules: flowMetadata.afterStateChangeRules,
            autoAdvanceMode: flowMetadata.autoAdvanceMode,
            metadata: flowMetadata.metadata,
          },
        }}
        existingFlowId={currentSavedFlowId || undefined}
        onSaved={(flowId) => {
          setCurrentSavedFlowId(flowId);
        }}
      />

      {/* Load Flows Dialog */}
      <LoadFlowsDialog
        isOpen={isLoadDialogOpen}
        onClose={() => setIsLoadDialogOpen(false)}
        onLoadFlow={(userFlow: UserFlow) => {
          // The flow_data now contains editor data format directly
          const editorData = userFlow.flow_data
            ? (userFlow.flow_data as unknown as EditorData)
            : null;

          if (editorData?.nodes && Array.isArray(editorData.nodes)) {
            setNodes(editorData.nodes);
            setEdges(
              editorData.edges?.map((edge) => ({
                ...edge,
                markerEnd: defaultEdgeMarkerEnd,
              })) || []
            );
            setFlowTitle(editorData.flowTitle || userFlow.title);
            setFlowMetadata(
              editorData.flowMetadata || {
                id: uuidv4(),
                title: userFlow.title,
                description: '',
                expressionLanguage: 'cel',
                initialState: {},
                stateSchema: undefined,
                metadata: userFlow.metadata || {},
              }
            );

            // Restore counters
            if (editorData.nodeIdCounter) {
              nodeIdSourceRef.current = editorData.nodeIdCounter;
            }
            if (editorData.edgeIdCounter) {
              edgeIdSourceRef.current = editorData.edgeIdCounter;
            }

            setCurrentSavedFlowId(userFlow.id);
            toast.success(`Loaded flow: ${userFlow.title}`);
          }
        }}
      />

      {/* Flow Share Dialog */}
      <FlowShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        flow={generateZFloFlow()}
      />

      {/* Manage Shared Flows Dialog */}
      <ManageSharedFlowsDialog
        isOpen={isManageSharedFlowsOpen}
        onClose={() => setIsManageSharedFlowsOpen(false)}
      />

      {/* Flow Metadata Editor Sheet */}
      <FlowMetadataEditor
        isOpen={activeSheet === 'metadata'}
        onClose={() => setActiveSheet(null)}
        flowMetadata={{
          id: flowMetadata.id,
          title: flowMetadata.title,
          description: flowMetadata.description,
          expressionLanguage: flowMetadata.expressionLanguage,
          stateSchema: flowMetadata.stateSchema
            ? JSON.stringify(flowMetadata.stateSchema)
            : undefined,
          initialState: flowMetadata.initialState
            ? JSON.stringify(flowMetadata.initialState)
            : undefined,
          metadata: flowMetadata.metadata,
        }}
        onSave={(metadata) => {
          setFlowMetadata({
            id: metadata.id,
            title: metadata.title,
            description: metadata.description,
            expressionLanguage: metadata.expressionLanguage,
            stateSchema: metadata.stateSchema
              ? JSON.parse(metadata.stateSchema)
              : undefined,
            initialState: metadata.initialState
              ? JSON.parse(metadata.initialState)
              : undefined,
            metadata: metadata.metadata,
          });
          if (metadata.title && metadata.title !== flowTitle) {
            setFlowTitle(metadata.title);
          }
        }}
      />

      {/* Global Node Editor */}
      {globalNodeEditor.isOpen &&
        globalNodeEditor.nodeId &&
        globalNodeEditor.nodeData && (
          <NodeEditor
            nodeId={globalNodeEditor.nodeId}
            isOpen={globalNodeEditor.isOpen}
            onClose={globalNodeEditor.closeEditor}
            nodeData={globalNodeEditor.nodeData}
            onUpdate={(updates) =>
              handleNodeUpdate(globalNodeEditor.nodeId!, updates)
            }
          />
        )}

      {/* Onboarding Dialog */}
      <OnboardingDialog
        open={showOnboarding}
        onOpenChange={(open) => {
          if (!open) {
            closeOnboarding();
          }
        }}
      />
    </div>
  );
}
