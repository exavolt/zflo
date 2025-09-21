import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from './ui/drowdown-menu';

export interface StatusBarProps {
  state: Record<string, unknown>;
  className?: string;
}

export function StatusBar({ state, className }: StatusBarProps) {
  const filteredState = Object.entries(state).filter(
    ([key]) => !key.startsWith('_')
  );

  if (filteredState.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent>
        <div className="flex items-center gap-4 flex-wrap">
          {filteredState.map(([key, value], index, arr) => (
            <React.Fragment key={key}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {key}:
                </span>
                {Array.isArray(value) ||
                (typeof value === 'object' && value !== null) ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-1">
                        <span className="text-sm font-semibold">
                          {Array.isArray(value)
                            ? `[${value.length}]`
                            : `{${Object.keys(value).length}}`}
                        </span>
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-48">
                      {Array.isArray(value) ? (
                        value.length === 0 ? (
                          <DropdownMenuLabel className="text-muted-foreground">
                            Empty
                          </DropdownMenuLabel>
                        ) : (
                          value.map((item, idx) => (
                            <DropdownMenuLabel
                              key={idx}
                              className="flex items-center gap-2"
                            >
                              <span className="text-sm">
                                {typeof item === 'string'
                                  ? `"${item}"`
                                  : String(item)}
                              </span>
                            </DropdownMenuLabel>
                          ))
                        )
                      ) : (
                        Object.entries(value).map(([k, v]) => (
                          <DropdownMenuLabel
                            key={k}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm font-medium">{k}:</span>
                            <span className="text-sm">
                              {typeof v === 'string' ? `"${v}"` : String(v)}
                            </span>
                          </DropdownMenuLabel>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="text-sm font-semibold">{String(value)}</span>
                )}
              </div>
              {index < arr.length - 1 && <Separator orientation="vertical" />}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
