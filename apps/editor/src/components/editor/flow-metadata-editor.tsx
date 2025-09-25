import { useState, useEffect, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { X, Plus, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExpressionLanguage } from '@zflo/core';

interface FlowMetadata {
  id: string;
  title: string;
  description?: string;
  expressionLanguage?: ExpressionLanguage;
  stateSchema?: string; // JSON string for editing
  initialState?: string; // JSON string for editing
  metadata?: Record<string, unknown>;
}

interface FlowMetadataEditorProps {
  isOpen: boolean;
  onClose: () => void;
  flowMetadata: FlowMetadata;
  onSave: (metadata: FlowMetadata) => void;
}

export function FlowMetadataEditor({
  isOpen,
  onClose,
  flowMetadata,
  onSave,
}: FlowMetadataEditorProps) {
  const [formData, setFormData] = useState<FlowMetadata>({
    id: '',
    title: '',
    description: '',
    expressionLanguage: 'cel',
    stateSchema: '',
    initialState: '',
    metadata: {},
  });

  const [metadataKeys, setMetadataKeys] = useState<string[]>([]);
  const [newMetadataKey, setNewMetadataKey] = useState('');
  const [errors, setErrors] = useState<{
    stateSchema?: string;
    initialState?: string;
  }>({});

  // Track if we're currently initializing to prevent unnecessary saves
  const isInitializingRef = useRef(false);

  // Initialize form data when flow changes
  useEffect(() => {
    if (flowMetadata) {
      isInitializingRef.current = true;

      setFormData({
        id: flowMetadata.id || '',
        title: flowMetadata.title || '',
        description: flowMetadata.description || '',
        expressionLanguage: flowMetadata.expressionLanguage || 'cel',
        stateSchema: flowMetadata.stateSchema,
        initialState: flowMetadata.initialState,
        metadata: flowMetadata.metadata || {},
      });

      setMetadataKeys(Object.keys(flowMetadata.metadata || {}));

      // Clear initialization flag after a short delay
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 50);
    }
  }, [flowMetadata]);

  const validateJSON = (jsonString: string, fieldName: string) => {
    if (!jsonString.trim()) return true;

    try {
      JSON.parse(jsonString);
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
      return true;
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }));
      return false;
    }
  };

  const handleInputChange = useCallback(
    (field: keyof FlowMetadata, value: string) => {
      if (isInitializingRef.current) return;

      setFormData((prev) => ({ ...prev, [field]: value }));

      // Validate JSON fields
      if (field === 'stateSchema' || field === 'initialState') {
        validateJSON(value, field);
      }
    },
    []
  );

  const handleMetadataChange = useCallback((key: string, value: string) => {
    if (isInitializingRef.current) return;

    setFormData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value,
      },
    }));
  }, []);

  const addMetadataField = useCallback(() => {
    if (newMetadataKey && !metadataKeys.includes(newMetadataKey)) {
      setMetadataKeys((prev) => [...prev, newMetadataKey]);
      setFormData((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [newMetadataKey]: '',
        },
      }));
      setNewMetadataKey('');
    }
  }, [newMetadataKey, metadataKeys]);

  const removeMetadataField = useCallback((key: string) => {
    setMetadataKeys((prev) => prev.filter((k) => k !== key));
    setFormData((prev) => {
      const { [key]: removed, ...rest } = prev.metadata || {};
      return { ...prev, metadata: rest };
    });
  }, []);

  const handleSave = () => {
    // Validate JSON fields before saving
    const stateSchemaValid = validateJSON(
      formData.stateSchema || '',
      'stateSchema'
    );
    const initialStateValid = validateJSON(
      formData.initialState || '',
      'initialState'
    );

    if (!stateSchemaValid || !initialStateValid) {
      return;
    }

    try {
      const updatedFlow: FlowMetadata = {
        id: formData.id,
        title: formData.title,
        description: formData.description || undefined,
        expressionLanguage: formData.expressionLanguage,
        stateSchema: formData.stateSchema,
        initialState: formData.initialState,
        metadata:
          Object.keys(formData.metadata || {}).length > 0
            ? formData.metadata
            : undefined,
      };

      onSave(updatedFlow);
      onClose();
    } catch (error) {
      console.error('Error saving flow metadata:', error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="sm:max-w-lg gap-0">
        <SheetHeader className="border-b">
          <SheetTitle>Flow Settings</SheetTitle>
        </SheetHeader>

        <div className="p-6 flex flex-col overflow-y-auto gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="flow-id">Flow ID</Label>
              <Input
                id="flow-id"
                value={formData.id}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('id', e.target.value)
                }
                placeholder="unique-flow-id"
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flow-title">Title</Label>
              <Input
                id="flow-title"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('title', e.target.value)
                }
                placeholder="Flow Title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flow-description">Description</Label>
              <Textarea
                id="flow-description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleInputChange('description', e.target.value)
                }
                placeholder="Describe what this flow does..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expression-language">Expression Language</Label>
              <Select
                value={formData.expressionLanguage}
                onValueChange={(value: 'liquid' | 'cel') =>
                  handleInputChange('expressionLanguage', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="liquid">Liquid (Default)</SelectItem>
                  <SelectItem value="cel">
                    CEL (Common Expression Language)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* State Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">State Configuration</h3>

            <div className="space-y-2">
              <Label htmlFor="global-state">Global State (JSON)</Label>
              <Textarea
                id="global-state"
                value={formData.initialState}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleInputChange('initialState', e.target.value)
                }
                placeholder='{"health": 100, "level": 1}'
                rows={4}
                className={cn(
                  'font-mono',
                  errors.initialState ? 'border-destructive' : ''
                )}
              />
              {errors.initialState && (
                <p className="text-sm text-destructive">
                  {errors.initialState}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state-schema">State Schema (JSON Schema)</Label>
              <Textarea
                id="state-schema"
                value={formData.stateSchema}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleInputChange('stateSchema', e.target.value)
                }
                placeholder='{"type": "object", "properties": {"health": {"type": "number"}}}'
                rows={6}
                className={cn(
                  'font-mono',
                  errors.stateSchema ? 'border-destructive' : ''
                )}
              />
              {errors.stateSchema && (
                <p className="text-sm text-destructive">{errors.stateSchema}</p>
              )}
              <p className="text-xs text-muted-foreground">
                JSON Schema for validating state changes. Leave empty to disable
                validation.
              </p>
            </div>
          </div>

          {/* Custom Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Custom Metadata</h3>

            <div className="flex gap-2">
              <Input
                value={newMetadataKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewMetadataKey(e.target.value)
                }
                placeholder="metadata key"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMetadataField();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMetadataField}
                disabled={
                  !newMetadataKey || metadataKeys.includes(newMetadataKey)
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {metadataKeys.length > 0 && (
              <div className="space-y-3">
                {metadataKeys.map((key) => (
                  <div key={key} className="flex gap-2 items-center">
                    <Badge variant="outline" className="min-w-0 flex-shrink-0">
                      {key}
                    </Badge>
                    <Input
                      value={(formData.metadata?.[key] as string) || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleMetadataChange(key, e.target.value)
                      }
                      placeholder="value"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMetadataField(key)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 py-4 px-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!!errors.stateSchema || !!errors.initialState}
            className="flex-1"
          >
            <Save />
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
