import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { FolderOpen, Loader2, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getUserFlows,
  deleteUserFlow,
  type UserFlow,
} from '@zflo/platform-core';
import { cn } from '@/lib/utils';
import { EditorData } from '@/types';

interface LoadFlowsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadFlow: (flow: UserFlow) => void;
}

export function LoadFlowsDialog({
  isOpen,
  onClose,
  onLoadFlow,
}: LoadFlowsDialogProps) {
  const [flows, setFlows] = useState<UserFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const userFlows = await getUserFlows();
      setFlows(userFlows);
    } catch (error) {
      console.error('Failed to load flows:', error);
      toast.error('Failed to load saved flows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFlows();
    }
  }, [isOpen]);

  const handleDelete = async (flowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(flowId);
    try {
      await deleteUserFlow(flowId);
      setFlows(flows.filter((f) => f.id !== flowId));
      toast.success('Flow deleted successfully');
    } catch (error) {
      console.error('Failed to delete flow:', error);
      toast.error('Failed to delete flow');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Load Saved Flow
          </DialogTitle>
          <DialogDescription>
            Choose a flow from your saved flows to load into the editor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading flows...</span>
            </div>
          ) : flows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No saved flows found</p>
              <p className="text-sm">Save a flow first to see it here</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {flows.map((flow) => (
                <div
                  key={flow.id}
                  className={cn(
                    'flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors',
                    'group'
                  )}
                  onClick={() => {
                    onLoadFlow(flow);
                    onClose();
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{flow.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {flow.flow_data
                          ? (flow.flow_data as unknown as EditorData).nodes
                              ?.length || 0
                          : 0}{' '}
                        nodes
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        Updated{' '}
                        {flow.updated_at
                          ? formatDate(flow.updated_at)
                          : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(flow.id, e)}
                    disabled={deletingId === flow.id}
                  >
                    {deletingId === flow.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
