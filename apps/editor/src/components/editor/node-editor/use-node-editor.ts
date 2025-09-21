import { useState, useMemo } from 'react';
import { NodeData, NodeOutlet } from '@/types';
import type { StateAction } from '@zflo/core';

export function useNodeEditor(nodeId: string, nodeData: NodeData) {
  const [title, setTitle] = useState(nodeData.title);
  const [content, setContent] = useState(nodeData.content);
  const [outlets, setOutlets] = useState<NodeOutlet[]>(nodeData.outlets || []);
  const [actions, setActions] = useState<StateAction[]>(nodeData.actions || []);
  const [autoAdvance, setAutoAdvance] = useState<boolean | 'indeterminate'>(
    nodeData.autoAdvance === undefined ? 'indeterminate' : nodeData.autoAdvance
  );

  // Outlet management
  const addOutlet = () => {
    const existingOutletIds = outlets
      .map((outlet) => outlet.id)
      .filter((id) => id.startsWith(`${nodeId}-o`))
      .map((id) => Number(id.replace(`${nodeId}-o`, '')));
    const nextOutletId = Math.max(...existingOutletIds, 0) + 1;

    const newOutlet: NodeOutlet = {
      id: `${nodeId}-o${nextOutletId}`,
      label: `Choice ${nextOutletId}`,
      condition: '',
    };
    setOutlets([...outlets, newOutlet]);
  };

  const removeOutlet = (outletId: string) => {
    setOutlets(outlets.filter((outlet) => outlet.id !== outletId));
  };

  const updateOutlet = (id: string, updates: Partial<NodeOutlet>) => {
    setOutlets(
      outlets.map((outlet) =>
        outlet.id === id ? { ...outlet, ...updates } : outlet
      )
    );
  };

  // Outlet action management
  const addOutletAction = (outletId: string) => {
    const newAction: StateAction = {
      type: 'set',
      target: '',
      expression: '',
    };
    setOutlets(
      outlets.map((outlet) =>
        outlet.id === outletId
          ? { ...outlet, actions: [...(outlet.actions || []), newAction] }
          : outlet
      )
    );
  };

  const updateOutletAction = (
    outletId: string,
    actionIndex: number,
    updates: Partial<StateAction>
  ) => {
    setOutlets(
      outlets.map((outlet) =>
        outlet.id === outletId
          ? {
              ...outlet,
              actions:
                outlet.actions?.map((action, index) =>
                  index === actionIndex ? { ...action, ...updates } : action
                ) || [],
            }
          : outlet
      )
    );
  };

  const removeOutletAction = (outletId: string, actionIndex: number) => {
    setOutlets(
      outlets.map((outlet) =>
        outlet.id === outletId
          ? {
              ...outlet,
              actions:
                outlet.actions?.filter((_, index) => index !== actionIndex) ||
                [],
            }
          : outlet
      )
    );
  };

  // Node action management
  const addAction = () => {
    const newAction: StateAction = {
      type: 'set',
      target: '',
      expression: '',
    };
    setActions([...actions, newAction]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, updates: Partial<StateAction>) => {
    setActions(
      actions.map((action, i) =>
        i === index ? { ...action, ...updates } : action
      )
    );
  };

  // Validation
  const isBadAutoAdvance = useMemo(() => {
    const hasConditions = outlets
      .slice(0, -1)
      .every((outlet) => outlet.condition);
    const hasLastOutlet = outlets.length >= 2;
    return autoAdvance === true && (!hasConditions || !hasLastOutlet);
  }, [autoAdvance, outlets]);

  // Get final data for saving
  const getNodeData = (): Partial<NodeData> => ({
    title,
    content,
    autoAdvance:
      autoAdvance === 'indeterminate' ? undefined : autoAdvance === true,
    outlets,
    actions,
    outputCount: outlets.length,
  });

  return {
    // State
    title,
    content,
    outlets,
    actions,
    autoAdvance,
    isBadAutoAdvance,

    // Setters
    setTitle,
    setContent,
    setAutoAdvance,

    // Outlet handlers
    addOutlet,
    removeOutlet,
    updateOutlet,
    addOutletAction,
    updateOutletAction,
    removeOutletAction,

    // Action handlers
    addAction,
    removeAction,
    updateAction,

    // Utilities
    getNodeData,
  };
}
