import { useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import {
  Settings,
  Globe,
  Lock,
  ExternalLink,
  Copy,
  Trash2,
  Loader2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useUserSharedFlows,
  updateSharedFlowVisibility,
  deleteSharedFlow,
  type SharedFlow,
} from '@zflo/platform-core';

interface ManageSharedFlowsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageSharedFlowsDialog({
  isOpen,
  onClose,
}: ManageSharedFlowsDialogProps) {
  const { flows, loading, error, refetch } = useUserSharedFlows();
  const [updatingFlow, setUpdatingFlow] = useState<string | null>(null);
  const [deletingFlow, setDeletingFlow] = useState<string | null>(null);

  const handleVisibilityChange = async (flowId: string, isPublic: boolean) => {
    setUpdatingFlow(flowId);
    try {
      await updateSharedFlowVisibility(flowId, isPublic);
      toast.success(
        `Flow visibility updated to ${isPublic ? 'public' : 'private'}`
      );
      refetch();
    } catch (error) {
      console.error('Failed to update visibility:', error);
      toast.error('Failed to update flow visibility');
    } finally {
      setUpdatingFlow(null);
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    setDeletingFlow(flowId);
    try {
      await deleteSharedFlow(flowId);
      toast.success('Shared flow deleted');
      refetch();
    } catch (error) {
      console.error('Failed to delete flow:', error);
      toast.error('Failed to delete flow');
    } finally {
      setDeletingFlow(null);
    }
  };

  const handleCopyLink = async (flowId: string) => {
    const url =
      (import.meta.env.VITE_PLAY_BASE_URL || `${window.location.origin}/play`) +
      `/${flowId}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleOpenFlow = (flowId: string) => {
    const url =
      (import.meta.env.VITE_PLAY_BASE_URL || `${window.location.origin}/play`) +
      `/${flowId}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Manage Shared Flows
          </DialogTitle>
          <DialogDescription>
            View and manage your shared flows. Change visibility or delete flows
            as needed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading your shared flows...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              <p>Failed to load shared flows: {error}</p>
              <Button variant="outline" onClick={refetch} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && flows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You haven't shared any flows yet.</p>
              <p className="text-sm">Share a flow to see it listed here.</p>
            </div>
          )}

          {!loading && !error && flows.length > 0 && (
            <div className="space-y-4">
              {flows.map((flow: SharedFlow) => (
                <div key={flow.id} className="border rounded-lg p-4 space-y-3">
                  {/* Flow Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{flow.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs">
                          {flow.created_at
                            ? new Date(flow.created_at).toLocaleDateString()
                            : 'Unknown date'}
                        </span>
                        <Badge
                          variant={flow.is_public ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {flow.is_public ? (
                            <>
                              <Globe className="w-3 h-3 mr-1" />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 mr-1" />
                              Private
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyLink(flow.id)}
                      >
                        <Copy />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenFlow(flow.id)}
                      >
                        <ExternalLink />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFlow(flow.id)}
                        disabled={deletingFlow === flow.id}
                      >
                        {deletingFlow === flow.id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Trash2 />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Visibility Controls */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Visibility</Label>
                    <RadioGroup
                      value={flow.is_public ? 'public' : 'private'}
                      onValueChange={(value) =>
                        handleVisibilityChange(flow.id, value === 'public')
                      }
                      disabled={updatingFlow === flow.id}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="private"
                          id={`private-${flow.id}`}
                        />
                        <Label
                          htmlFor={`private-${flow.id}`}
                          className="flex items-center gap-2 cursor-pointer text-sm"
                        >
                          <Lock className="w-3 h-3" />
                          Private - Only accessible via link
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="public"
                          id={`public-${flow.id}`}
                        />
                        <Label
                          htmlFor={`public-${flow.id}`}
                          className="flex items-center gap-2 cursor-pointer text-sm"
                        >
                          <Globe className="w-3 h-3" />
                          Public - Listed in community flows
                        </Label>
                      </div>
                    </RadioGroup>
                    {updatingFlow === flow.id && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Updating visibility...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
