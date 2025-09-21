import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';

interface BasicInfoSectionProps {
  title: string;
  content: string;
  autoAdvance: boolean | 'indeterminate';
  isBadAutoAdvance: boolean;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onAutoAdvanceChange: (checked: boolean | 'indeterminate') => void;
}

export function BasicInfoSection({
  title,
  content,
  autoAdvance,
  isBadAutoAdvance,
  onTitleChange,
  onContentChange,
  onAutoAdvanceChange,
}: BasicInfoSectionProps) {
  return (
    <>
      {/* Node Title */}
      <div className="grid gap-2">
        <Label>Title</Label>
        <Input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Node title"
        />
      </div>

      {/* Node Content */}
      <div className="grid gap-2">
        <Label>Content</Label>
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-20"
          placeholder="Node content or description"
        />
      </div>

      {/* Auto Advance */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="auto-advance"
          defaultChecked={autoAdvance === true}
          onCheckedChange={onAutoAdvanceChange}
        />
        <div className="grid gap-2">
          <Label htmlFor="auto-advance">Auto Advance</Label>
          <p className="text-muted-foreground text-sm">
            If checked, the node will automatically pick the first outlet with a{' '}
            <a
              href="https://simple.wikipedia.org/wiki/Conditional_(computer_programming)"
              target="_blank"
              rel="noopener noreferrer"
            >
              condition that evaluates to true
            </a>
            .
          </p>
          {isBadAutoAdvance && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Invalid Auto Advance</AlertTitle>
              <AlertDescription>
                Auto Advance requires at least two outlets with all but the last
                having a condition.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </>
  );
}
