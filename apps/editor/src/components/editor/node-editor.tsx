import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { NodeData } from '@/types';
import { useNodeEditor } from './node-editor/use-node-editor';
import { BasicInfoSection } from './node-editor/basic-info-section';
import { CollapsibleSection } from './node-editor/collapsible-section';
import { OutletEditor } from './node-editor/outlet-editor';
import { ActionEditor } from './node-editor/action-editor';

interface NodeEditorProps {
  nodeId: string;
  isOpen: boolean;
  onClose: () => void;
  nodeData: NodeData;
  onUpdate: (updates: Partial<NodeData>) => void;
}

export function NodeEditor({
  nodeId,
  isOpen,
  onClose,
  nodeData,
  onUpdate,
}: NodeEditorProps) {
  const {
    title,
    content,
    outlets,
    actions,
    autoAdvance,
    isBadAutoAdvance,
    setTitle,
    setContent,
    setAutoAdvance,
    addOutlet,
    removeOutlet,
    updateOutlet,
    addOutletAction,
    updateOutletAction,
    removeOutletAction,
    addAction,
    removeAction,
    updateAction,
    getNodeData,
  } = useNodeEditor(nodeId, nodeData);

  const handleSave = () => {
    onUpdate(getNodeData());
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="sm:max-w-lg gap-0">
        <SheetHeader className="border-b">
          <SheetTitle>Edit Node</SheetTitle>
        </SheetHeader>

        <div className="p-6 flex flex-col overflow-y-auto gap-6">
          <BasicInfoSection
            title={title}
            content={content}
            autoAdvance={autoAdvance}
            isBadAutoAdvance={isBadAutoAdvance}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onAutoAdvanceChange={setAutoAdvance}
          />

          <CollapsibleSection title="Outlets" count={outlets.length}>
            <div className="flex flex-col gap-2">
              {outlets.map((outlet, index) => (
                <OutletEditor
                  key={outlet.id}
                  outlet={outlet}
                  index={index}
                  totalOutlets={outlets.length}
                  autoAdvance={autoAdvance}
                  onUpdate={(updates) => updateOutlet(outlet.id, updates)}
                  onRemove={() => removeOutlet(outlet.id)}
                  onAddAction={() => addOutletAction(outlet.id)}
                  onUpdateAction={(actionIndex, updates) =>
                    updateOutletAction(outlet.id, actionIndex, updates)
                  }
                  onRemoveAction={(actionIndex) =>
                    removeOutletAction(outlet.id, actionIndex)
                  }
                />
              ))}

              {outlets.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No outlets defined. Add outlets to create branching paths.
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addOutlet}
              className="w-full"
            >
              <Plus />
              Add Outlet
            </Button>
          </CollapsibleSection>

          <CollapsibleSection
            title="Node Actions (on enter)"
            count={actions.length}
            defaultOpen={actions.length > 0}
          >
            <div className="flex flex-col gap-2">
              {actions.map((action, index) => (
                <ActionEditor
                  key={index}
                  action={action}
                  index={index}
                  onUpdate={(updates) => updateAction(index, updates)}
                  onRemove={() => removeAction(index)}
                />
              ))}

              {actions.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No actions defined. Add actions to modify state when this node
                  is visited.
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addAction}
              className="w-full mt-2"
            >
              <Plus />
              Add Action
            </Button>
          </CollapsibleSection>
        </div>

        <SheetFooter className="flex flex-row gap-2 border-t">
          <Button onClick={handleSave} className="flex-1">
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
