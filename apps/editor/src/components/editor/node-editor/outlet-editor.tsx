import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { NodeOutlet } from '@/types';
import { ActionEditor } from './action-editor';
import type { StateAction } from '@zflo/core';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface OutletEditorProps {
  outlet: NodeOutlet;
  index: number;
  totalOutlets: number;
  autoAdvance: boolean | 'indeterminate';
  onUpdate: (updates: Partial<NodeOutlet>) => void;
  onRemove: () => void;
  onAddAction: () => void;
  onUpdateAction: (actionIndex: number, updates: Partial<StateAction>) => void;
  onRemoveAction: (actionIndex: number) => void;
}

export function OutletEditor({
  outlet,
  index,
  totalOutlets,
  autoAdvance,
  onUpdate,
  onRemove,
  onAddAction,
  onUpdateAction,
  onRemoveAction,
}: OutletEditorProps) {
  const conditionType = useMemo(() => {
    if (autoAdvance === true) {
      return index === totalOutlets - 1 ? 'prohibited' : 'required';
    }
    return 'optional';
  }, [autoAdvance, index, totalOutlets]);

  const conditionLabel = useMemo(() => {
    switch (conditionType) {
      case 'required':
        return '*';
      case 'prohibited':
        return '(must be empty)';
      case 'optional':
        return '(optional)';
    }
  }, [conditionType]);

  const hasCondition = useMemo(() => {
    return (
      outlet.condition !== null &&
      outlet.condition !== undefined &&
      outlet.condition !== ''
    );
  }, [outlet.condition]);

  return (
    <Collapsible
      key={outlet.id}
      defaultOpen={true}
      className="group/sub-collapsible"
    >
      <div className="border rounded-md">
        <div className="flex flex-row items-center bg-secondary rounded-t-md overflow-hidden">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex-1 justify-start overflow-hidden whitespace-normal"
            >
              <ChevronRight className="transition-transform group-data-[state=open]/sub-collapsible:rotate-90" />
              {outlet.label ? (
                <span className="text-start">{outlet.label}</span>
              ) : (
                <span className="text-start text-muted-foreground italic">
                  Unlabeled outlet
                </span>
              )}
            </Button>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="flex-shrink-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <CollapsibleContent className="p-3 flex flex-col gap-3">
          <div className="grid gap-2">
            <Label
              htmlFor={`outlet-label-${outlet.id}`}
              className="text-xs font-medium"
            >
              Label
            </Label>
            <Input
              id={`outlet-label-${outlet.id}`}
              type="text"
              value={outlet.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Outlet label"
            />
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor={`outlet-condition-${outlet.id}`}
              className={cn('text-xs font-medium', {
                'text-red-500': conditionType === 'required' && !hasCondition,
              })}
            >
              Condition {conditionLabel}
            </Label>
            <Input
              id={`outlet-condition-${outlet.id}`}
              type="text"
              value={outlet.condition || ''}
              onChange={(e) => onUpdate({ condition: e.target.value })}
              className="font-mono"
              placeholder="e.g., score > 10"
              disabled={conditionType === 'prohibited'}
            />
            <div className="flex items-center gap-3">
              <Checkbox
                id={`outlet-condition-${outlet.id}-visibility`}
                disabled={!hasCondition}
              />
              <Label htmlFor={`outlet-condition-${outlet.id}-visibility`}>
                Show this outlet even when condition is not met
              </Label>
            </div>
          </div>

          {/* Outlet Actions */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-medium">
                <span>Outlet Actions</span>
                <Badge variant="secondary" className="rounded-full">
                  {outlet.actions?.length || 0}
                </Badge>
              </Label>
              <Button variant="ghost" size="sm" onClick={onAddAction}>
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>

            {outlet.actions && outlet.actions.length > 0 ? (
              <div className="space-y-2">
                {outlet.actions.map((action, actionIndex) => (
                  <ActionEditor
                    key={actionIndex}
                    action={action}
                    index={actionIndex}
                    onUpdate={(updates) => onUpdateAction(actionIndex, updates)}
                    onRemove={() => onRemoveAction(actionIndex)}
                    isOutletAction={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-muted-foreground">
                No actions defined for this outlet
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
