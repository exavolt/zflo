import { NodeProps, Position, useReactFlow } from '@xyflow/react';
import { ZEdHandle } from './zed-handle';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { FastForwardIcon, MoreHorizontalIcon, ZapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeData } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useNodeEditorContext } from '@/contexts/node-editor-context';

// Simple node component
export function ZEdNode({ id, data, selected }: NodeProps) {
  const { getNodeConnections } = useReactFlow();
  const { openEditor } = useNodeEditorContext();

  const nodeData = data as unknown as NodeData;
  let nodeType = 'isolated';
  const nodeTitle = nodeData.title || 'Untitled';
  const nodeContent = nodeData.content || '';
  const outlets = nodeData.outlets || [];

  const colors = {
    start:
      'bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-800',
    action: 'bg-sky-100 border-sky-500 dark:bg-sky-900 dark:border-sky-800',
    decision:
      'bg-indigo-100 border-indigo-500 dark:bg-indigo-900 dark:border-indigo-800',
    end: 'bg-fuchsia-100 border-fuchsia-500 dark:bg-fuchsia-900 dark:border-fuchsia-800',
    isolated:
      'bg-gray-100 border-gray-500 dark:bg-gray-900 dark:border-gray-800',
    error: 'bg-red-100 border-red-500 dark:bg-red-900 dark:border-red-800',
    autoAdvance:
      'bg-yellow-100 border-yellow-500 dark:bg-yellow-900 dark:border-yellow-800',
  };

  const connections = getNodeConnections({ nodeId: id });
  if (connections.length === 0) {
    nodeType = 'isolated';
  } else if (nodeData.autoAdvance) {
    nodeType = 'autoAdvance';
  } else {
    const ins = connections.filter((conn) => conn.target === id);
    const outs = connections.filter((conn) => conn.source === id);
    if (
      nodeData.outlets &&
      nodeData.outlets.length > 0 &&
      nodeData.outlets.length !== outs.length
    ) {
      nodeType = 'error';
    } else {
      if (ins.length === 0) {
        nodeType = 'start';
      } else if (outs.length === 0) {
        nodeType = 'end';
      } else if (ins.length > 0 && outs.length > 1) {
        nodeType = 'decision';
      } else if (ins.length > 0 && outs.length === 1) {
        nodeType = 'action';
      } else {
        nodeType = 'isolated';
      }
    }
  }

  const hasActions = (nodeData.actions?.length ?? 0) > 0;

  const handleEditClick = () => {
    openEditor(id, nodeData);
  };

  return (
    <>
      <ZEdHandle
        type="target"
        position={Position.Left}
        style={{ left: 0, top: '20px' }}
      />

      <Card
        onDoubleClick={handleEditClick}
        className={cn(
          `w-[200px] min-h-[64px] px-3 pt-2 pb-2.5 m-0 gap-2 shadow-none`,
          colors[nodeType as keyof typeof colors],
          selected && 'ring-3 ring-offset-2 ring-primary shadow-lg'
        )}
      >
        <CardHeader className="p-0">
          <CardTitle className="text-sm">
            <span className="flex flex-row items-center gap-1">
              {nodeType === 'autoAdvance' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FastForwardIcon className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Auto-advance</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {hasActions && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ZapIcon className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Performs actions</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
            <span>{nodeTitle}</span>
          </CardTitle>
          <CardAction className="-mr-2.5 -mt-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEditClick}
              className="h-6 w-6 p-0"
            >
              <MoreHorizontalIcon className="h-3 w-3" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col p-0 gap-4">
          {nodeContent && (
            <div className="text-xs text-foreground/70">
              {nodeContent.length > 100
                ? nodeContent.substring(0, 100) + '...'
                : nodeContent}
            </div>
          )}

          {/* Render outlets */}
          {outlets.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium text-foreground/70">
                Outlets:
              </div>
              {outlets.map((outlet) => (
                <div
                  key={outlet.id}
                  className="flex items-center gap-2 text-xs bg-background/50 rounded-l-md py-1 px-1.5 relative -ml-1.5 -mr-3"
                >
                  <div className="flex-1 bg-transparent border-none outline-none text-xs">
                    {outlet.label}
                  </div>
                  {/* Output handle for this specific outlet */}
                  <ZEdHandle
                    type="source"
                    position={Position.Right}
                    id={outlet.id}
                    style={{
                      right: -1,
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default output handle for nodes without specific outlets */}
      {outlets.length === 0 && (
        <ZEdHandle
          type="source"
          position={Position.Right}
          style={{ right: 0, bottom: '8px', top: 'auto' }}
        />
      )}
    </>
  );
}
