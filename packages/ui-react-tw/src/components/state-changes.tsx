import * as React from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Plus, Minus, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface StateChange {
  key: string;
  type: 'added' | 'removed' | 'increased' | 'decreased' | 'changed';
  oldValue?: unknown;
  newValue?: unknown;
  delta?: number;
}

interface StateChangesProps {
  previousState: Record<string, unknown>;
  currentState: Record<string, unknown>;
  className?: string;
}

export const StateChanges: React.FC<StateChangesProps> = ({
  previousState,
  currentState,
  className,
}) => {
  const getStateChanges = (): StateChange[] => {
    const changes: StateChange[] = [];

    // Check all keys in current state
    Object.keys(currentState).forEach((key) => {
      if (key.startsWith('_')) return; // Skip internal keys

      const oldValue = previousState[key];
      const newValue = currentState[key];

      if (Array.isArray(newValue)) {
        // Handle array changes (inventory items)
        const oldArray = Array.isArray(oldValue) ? oldValue : [];
        const added = newValue.filter((item) => !oldArray.includes(item));
        const removed = oldArray.filter((item) => !newValue.includes(item));

        added.forEach((item) => {
          changes.push({
            key,
            type: 'added',
            newValue: item,
          });
        });

        removed.forEach((item) => {
          changes.push({
            key,
            type: 'removed',
            oldValue: item,
          });
        });
      } else if (typeof newValue === 'number' && typeof oldValue === 'number') {
        // Handle numeric changes
        const delta = newValue - oldValue;
        if (delta !== 0) {
          changes.push({
            key,
            type: delta > 0 ? 'increased' : 'decreased',
            oldValue,
            newValue,
            delta: Math.abs(delta),
          });
        }
      } else if (oldValue !== newValue && oldValue !== undefined) {
        // Handle other value changes
        changes.push({
          key,
          type: 'changed',
          oldValue,
          newValue,
        });
      }
    });

    return changes;
  };

  const changes = getStateChanges();

  if (changes.length === 0) {
    return null;
  }

  const getChangeIcon = (type: StateChange['type']): React.ReactNode => {
    switch (type) {
      case 'added':
        return <Plus className="w-3 h-3" />;
      case 'removed':
        return <Minus className="w-3 h-3" />;
      case 'increased':
        return <ArrowUp className="w-3 h-3" />;
      case 'decreased':
        return <ArrowDown className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getChangeColor = (type: StateChange['type']): string => {
    switch (type) {
      case 'added':
      case 'increased':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'removed':
      case 'decreased':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'changed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatChangeText = (change: StateChange): React.ReactNode => {
    switch (change.type) {
      case 'added':
        return `+${change.newValue}`;
      case 'removed':
        return `-${change.oldValue}`;
      case 'increased':
        return `+${change.delta}`;
      case 'decreased':
        return `-${change.delta}`;
      case 'changed':
        const oldValue = change.oldValue?.toString();
        const newValue = change.newValue?.toString();
        return (
          <>
            <del>{oldValue}</del> → <ins>{newValue}</ins>
          </>
        );
      default:
        return '';
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Changes:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {changes.map((change, index) => (
            <Badge
              key={`${change.key}-${change.type}-${index}`}
              variant="outline"
              className={cn(
                'flex items-center gap-1 text-xs rounded-full',
                getChangeColor(change.type)
              )}
            >
              {getChangeIcon(change.type)}
              <span className="font-medium">{change.key}:</span>
              <span>{formatChangeText(change)}</span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
