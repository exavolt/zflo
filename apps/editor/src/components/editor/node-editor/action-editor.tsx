import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Trash2, ZapIcon } from 'lucide-react';
import type { StateAction } from '@zflo/core';
import { cn } from '@zflo/ui-react-tw';

interface ActionEditorProps {
  action: StateAction;
  index: number;
  onUpdate: (updates: Partial<StateAction>) => void;
  onRemove: () => void;
  isOutletAction?: boolean;
}

export function ActionEditor({
  action,
  index,
  onUpdate,
  onRemove,
  isOutletAction = false,
}: ActionEditorProps) {
  return (
    <div
      className={`border rounded p-2 ${isOutletAction ? 'bg-muted/20' : 'p-3'}`}
    >
      <div
        className={cn(
          'flex items-center justify-between mb-2',
          isOutletAction ? '' : '-mt-3'
        )}
      >
        <ZapIcon className="h-3 w-3 mr-1 shrink-0 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground flex-1">
          Action {index + 1}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className={isOutletAction ? 'h-4 w-4' : '-mr-3'}
        >
          {isOutletAction ? (
            <X className="h-2 w-2" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      </div>

      <div className="grid gap-2">
        <div>
          <Label className="text-xs">Target</Label>
          <Input
            value={action.target}
            onChange={(e) => onUpdate({ target: e.target.value })}
            className="font-mono"
            placeholder="e.g., health, player.level"
          />
        </div>
        <div>
          <Label className="text-xs">Expression</Label>
          {isOutletAction ? (
            <Input
              value={action.expression || ''}
              onChange={(e) => onUpdate({ expression: e.target.value })}
              className="font-mono"
              placeholder="e.g., health + 10"
            />
          ) : (
            <Textarea
              value={action.expression || ''}
              onChange={(e) => onUpdate({ expression: e.target.value })}
              className="text-sm font-mono"
              placeholder="e.g., health + 10, level * 2, inventory + ['item']"
              rows={2}
            />
          )}
        </div>
      </div>
    </div>
  );
}
