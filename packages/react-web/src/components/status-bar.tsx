import React from 'react';
import { Popover } from './popover';

export interface StatusBarProps {
  state: Record<string, unknown>;
  hiddenStateVariables?: string[];
  theme?: 'light' | 'dark';
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  state,
  hiddenStateVariables = [],
  theme = 'light',
  className = '',
}) => {
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (Array.isArray(value)) {
      return value.length === 0 ? '[]' : `[${value.length} items]`;
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      return keys.length === 0 ? '{}' : `{${keys.length} props}`;
    }

    if (typeof value === 'string') {
      return value;
    }

    return String(value);
  };

  const renderPopoverContent = (value: unknown) => {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <div className="zflo-popover-empty">Empty array</div>;
      }
      return (
        <div>
          {value.map((item, index) => (
            <div key={index} className="zflo-popover-array-item">
              <span className="zflo-popover-array-index">[{index}]</span>
              {typeof item === 'string' ? `"${item}"` : String(item)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      const valueAsObject = value as Record<string, unknown>;
      const keys = Object.keys(valueAsObject);
      if (keys.length === 0) {
        return <div className="zflo-popover-empty">Empty object</div>;
      }
      return (
        <div>
          {keys.map((key) => (
            <div key={key} className="zflo-popover-item">
              <span className="zflo-popover-key">{key}:</span>
              <span className="zflo-popover-value">
                {typeof valueAsObject[key] === 'string'
                  ? `"${valueAsObject[key]}"`
                  : String(valueAsObject[key])}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return <div>{String(value)}</div>;
  };

  const isExpandable = (value: unknown): boolean => {
    return (
      Array.isArray(value) || (typeof value === 'object' && value !== null)
    );
  };

  const shouldHideVariable = (key: string): boolean => {
    return hiddenStateVariables.includes(key) || key.startsWith('_');
  };

  const visibleState = Object.entries(state).filter(
    ([key]) => !shouldHideVariable(key)
  );

  if (visibleState.length === 0) {
    return null;
  }

  return (
    <div className={`zflo-status-bar ${theme} ${className}`}>
      <div className="zflo-status-bar-content">
        {visibleState.map(([key, value], index) => (
          <React.Fragment key={key}>
            <div className="zflo-status-item">
              <span className="zflo-status-label">{key}:</span>
              <span className="zflo-status-value">
                {isExpandable(value) ? (
                  <Popover
                    trigger={
                      <span className="zflo-popover-trigger">
                        {formatValue(value)} ▼
                      </span>
                    }
                    content={renderPopoverContent(value)}
                    theme={theme}
                  />
                ) : (
                  formatValue(value)
                )}
              </span>
            </div>
            {index < visibleState.length - 1 && (
              <span className="zflo-status-separator">|</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
