import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface CollapsibleSectionProps {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group/collapsible">
      <div className="grid gap-2">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="justify-start overflow-hidden whitespace-normal -mx-6"
          >
            <ChevronRight className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
            <Label className="text-sm font-medium">
              <span>{title}</span>
              <Badge variant="secondary" className="rounded-full">
                {count}
              </Badge>
            </Label>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="grid gap-2">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
