import React, { useState, useMemo } from 'react';

// Deep equality check for proper array/object comparison
const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aAsObject = a as Record<string, unknown>;
    const bAsObject = b as Record<string, unknown>;
    const keysA = Object.keys(aAsObject);
    const keysB = Object.keys(bAsObject);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(aAsObject[key], bAsObject[key]))
        return false;
    }
    return true;
  }

  return false;
};

export interface StateDisplayProps {
  state: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  hiddenStateVariables?: string[];
  showStateDisplay?: boolean;
  compactStateDisplay?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  changesOnly?: boolean;
}

interface StateVariable {
  key: string;
  value: unknown;
  previousValue?: unknown;
  hasChanged: boolean;
  isHidden: boolean;
}

export const StateDisplay: React.FC<StateDisplayProps> = ({
  state,
  previousState = {},
  hiddenStateVariables = [],
  showStateDisplay = true,
  compactStateDisplay = false,
  theme = 'light',
  className = '',
  changesOnly = false,
}) => {
  const [collapsed, setCollapsed] = useState(compactStateDisplay);
  const [showHidden, setShowHidden] = useState(false);

  const stateVariables: StateVariable[] = useMemo(() => {
    const variables: StateVariable[] = [];

    Object.entries(state).forEach(([key, value]) => {
      const previousValue = (previousState as Record<string, unknown>)[key];
      const hasChanged = !deepEqual(value, previousValue);
      const isHidden =
        hiddenStateVariables.includes(key) || key.startsWith('_');

      variables.push({ key, value, previousValue, hasChanged, isHidden });
    });

    Object.entries(previousState).forEach(([key, previousValue]) => {
      if (!(key in state)) {
        const isHidden =
          hiddenStateVariables.includes(key) || key.startsWith('_');
        variables.push({
          key,
          value: undefined,
          previousValue,
          hasChanged: true,
          isHidden,
        });
      }
    });

    return variables.sort((a, b) => {
      if (a.hasChanged && !b.hasChanged) return -1;
      if (!a.hasChanged && b.hasChanged) return 1;
      return a.key.localeCompare(b.key);
    });
  }, [state, previousState, hiddenStateVariables]);

  const visibleVariables = stateVariables.filter((variable) => {
    if (changesOnly && !variable.hasChanged) return false;
    if (variable.isHidden && !showHidden) return false;
    return true;
  });

  const changedVariables = stateVariables.filter(
    (v) => v.hasChanged && !v.isHidden
  );
  const hiddenCount = stateVariables.filter((v) => v.isHidden).length;

  const formatValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'string') return `"${value}"`;
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      if (value.length <= 3) return `[${value.map(formatValue).join(', ')}]`;
      return `[${value.slice(0, 2).map(formatValue).join(', ')}, ... +${value.length - 2}]`;
    }
    if (typeof value === 'object') {
      const valueAsObject = value as Record<string, unknown>;
      const keys = Object.keys(valueAsObject);
      if (keys.length === 0) return '{}';
      if (keys.length <= 2) {
        return `{${keys.map((k) => `${k}: ${formatValue(valueAsObject[k])}`).join(', ')}}`;
      }
      return `{${keys
        .slice(0, 1)
        .map((k) => `${k}: ${formatValue(valueAsObject[k])}`)
        .join(', ')}, ... +${keys.length - 1}}`;
    }
    return String(value);
  };

  const getChangeIndicator = (variable: StateVariable) => {
    if (!variable.hasChanged) return null;

    return (
      <span className="zflo-state-change">
        <span className="zflo-state-change-from">
          {formatValue(variable.previousValue)}
        </span>
        <span className="zflo-state-change-arrow">→</span>
        <span className="zflo-state-change-to">
          {formatValue(variable.value)}
        </span>
      </span>
    );
  };

  if (
    !showStateDisplay ||
    (visibleVariables.length === 0 && changedVariables.length === 0)
  ) {
    return null;
  }

  return (
    <div
      className={`zflo-state-display ${theme} ${compactStateDisplay ? 'compact' : ''} ${className}`}
    >
      <div className="zflo-state-header">
        <button
          className="zflo-state-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Show state variables' : 'Hide state variables'}
        >
          <span className="zflo-state-icon">{collapsed ? '📊' : '📈'}</span>
          <span className="zflo-state-title">
            State{' '}
            {changedVariables.length > 0 &&
              `(${changedVariables.length} changed)`}
          </span>
          <span className="zflo-state-arrow">{collapsed ? '▶' : '▼'}</span>
        </button>
      </div>

      {!collapsed && (
        <div className="zflo-state-content">
          {changedVariables.length > 0 && (
            <div className="zflo-state-changes">
              <h4 className="zflo-state-section-title">Recent Changes</h4>
              {changedVariables.map((variable) => (
                <div key={variable.key} className="zflo-state-variable changed">
                  <span className="zflo-state-key">{variable.key}:</span>
                  {getChangeIndicator(variable)}
                </div>
              ))}
            </div>
          )}

          {!changesOnly && (
            <div className="zflo-state-all">
              <div className="zflo-state-controls">
                <h4 className="zflo-state-section-title">All Variables</h4>
                {hiddenCount > 0 && (
                  <button
                    className="zflo-state-show-hidden"
                    onClick={() => setShowHidden(!showHidden)}
                  >
                    {showHidden ? 'Hide' : 'Show'} hidden ({hiddenCount})
                  </button>
                )}
              </div>

              <div className="zflo-state-variables">
                {visibleVariables.map((variable) => (
                  <div
                    key={variable.key}
                    className={`zflo-state-variable ${variable.hasChanged ? 'changed' : ''} ${variable.isHidden ? 'hidden' : ''}`}
                  >
                    <span className="zflo-state-key">{variable.key}:</span>
                    <span className="zflo-state-value">
                      {formatValue(variable.value)}
                    </span>
                    {variable.hasChanged && (
                      <span className="zflo-state-change-badge">●</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
