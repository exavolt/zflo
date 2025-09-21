import { useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
  Copy,
  ExternalLink,
  Loader2,
  Share,
  Globe,
  Lock,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { saveSharedFlow } from '@zflo/platform-core';
import type { ZFFlow } from '@zflo/core';
import { Textarea } from '../ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface FlowShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  flow: ZFFlow;
}

export function FlowShareDialog({
  isOpen,
  onClose,
  flow,
}: FlowShareDialogProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const flowId = await saveSharedFlow(flow, flow.title, isPublic);
      const playBaseUrl =
        import.meta.env.VITE_PLAY_BASE_URL || `${window.location.origin}/play`;
      const url = `${playBaseUrl}/${flowId}`;
      setShareUrl(url);
      toast.success(`Flow shared ${isPublic ? 'publicly' : 'privately'}!`);
    } catch (error) {
      console.error('Failed to share flow:', error);
      toast.error('Failed to share flow. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyUrl = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleOpenInNewTab = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const handleClose = () => {
    setShareUrl(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Flow
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for others to play your flow
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="grid gap-1">
                <Label htmlFor="flow-title">Flow Title</Label>
                <Input
                  id="flow-title"
                  value={flow.title}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit through flow settings in the editor</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="grid gap-1">
                <Label htmlFor="flow-description">Flow Description</Label>
                <Textarea
                  id="flow-description"
                  value={flow.description}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit through flow settings in the editor</p>
            </TooltipContent>
          </Tooltip>

          <div className="space-y-3">
            <Label>Visibility</Label>
            <RadioGroup
              value={isPublic ? 'public' : 'private'}
              onValueChange={(value) => setIsPublic(value === 'public')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label
                  htmlFor="private"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  Private - Only accessible via link
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label
                  htmlFor="public"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  Public - Listed in community flows
                </Label>
              </div>
            </RadioGroup>
          </div>

          {!shareUrl ? (
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating share link...
                </>
              ) : (
                <>
                  <Share className="w-4 h-4 mr-2" />
                  Create Share Link
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="share-url">Share URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    className="bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleOpenInNewTab}
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Anyone with this link can play your flow. The link will remain
                active indefinitely.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
