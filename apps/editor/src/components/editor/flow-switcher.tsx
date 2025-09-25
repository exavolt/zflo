import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronDown, Plus, Trash2, FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlowSwitcherProps {
  flows: Array<{
    id: string;
    flowTitle: string;
    lastModified: number;
    nodes: any[];
  }>;
  activeFlowId: string;
  onSwitchFlow: (flowId: string) => void;
  onCreateFlow: (title: string) => void | Promise<void>;
  onDeleteFlow: (flowId: string) => void;
}

export function FlowSwitcher({
  flows,
  activeFlowId,
  onSwitchFlow,
  onCreateFlow,
  onDeleteFlow,
}: FlowSwitcherProps) {
  const activeFlow = flows.find((f) => f.id === activeFlowId);

  const handleCreateFlow = async () => {
    const flowNumber = flows.length + 1;
    const defaultTitle = `Flow ${flowNumber}`;
    try {
      await onCreateFlow(defaultTitle);
    } catch (error) {
      console.error('Failed to create flow:', error);
    }
  };

  const formatLastModified = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-[200px] justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {activeFlow?.flowTitle || 'No Flow Selected'}
            </span>
            {flows.length > 1 && (
              <Badge variant="secondary" className="text-xs">
                {flows.length}
              </Badge>
            )}
          </div>
          <ChevronDown className="w-4 h-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start">
        {/* Current flows */}
        <div className="max-h-64 overflow-y-auto">
          {flows.map((flow) => (
            <DropdownMenuItem
              key={flow.id}
              className={cn(
                'flex items-center justify-between p-3 cursor-pointer',
                flow.id === activeFlowId && 'bg-accent'
              )}
              onClick={() => onSwitchFlow(flow.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{flow.flowTitle}</span>
                  {flow.id === activeFlowId && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatLastModified(flow.lastModified)}</span>
                  <span>•</span>
                  <span>{flow.nodes.length} nodes</span>
                </div>
              </div>
              {flows.length > 1 && flow.id !== activeFlowId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFlow(flow.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        {/* Create new flow */}
        <DropdownMenuItem
          className="flex items-center gap-2 p-3 cursor-pointer"
          onClick={handleCreateFlow}
        >
          <Plus className="w-4 h-4" />
          <span>Create New Flow</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
