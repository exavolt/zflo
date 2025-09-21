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
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { saveUserFlow, updateUserFlow } from '@zflo/platform-core';
import { EditorData } from '@/types';

interface SaveFlowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editorData: EditorData;
  existingFlowId?: string;
  onSaved?: (flowId: string) => void;
}

export function SaveFlowDialog({
  isOpen,
  onClose,
  editorData,
  existingFlowId,
  onSaved,
}: SaveFlowDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(editorData.flowTitle || '');

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title for your flow');
      return;
    }

    setIsSaving(true);
    try {
      let flowId: string;

      if (existingFlowId) {
        await updateUserFlow(
          existingFlowId,
          editorData,
          title.trim(),
          editorData.flowMetadata || {}
        );
        flowId = existingFlowId;
        toast.success('Flow updated successfully!');
      } else {
        flowId = await saveUserFlow(
          editorData,
          title.trim(),
          editorData.flowMetadata || {}
        );
        toast.success('Flow saved successfully!');
      }

      onSaved?.(flowId);
      onClose();
    } catch (error) {
      console.error('Failed to save flow:', error);
      toast.error('Failed to save flow. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setTitle(editorData.flowTitle || '');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            {existingFlowId ? 'Update Flow' : 'Save Flow'}
          </DialogTitle>
          <DialogDescription>
            {existingFlowId
              ? 'Update your flow in the cloud'
              : 'Save your flow to the cloud for future access'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="flow-title">Flow Title</Label>
            <Input
              id="flow-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter flow title..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {existingFlowId ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {existingFlowId ? 'Update' : 'Save'}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
