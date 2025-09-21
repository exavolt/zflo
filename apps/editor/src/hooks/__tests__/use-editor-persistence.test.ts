import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEditorPersistence } from '../use-editor-persistence';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useEditorPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // it('should save state to localStorage', () => {
  //   const { result } = renderHook(() => useEditorPersistence());

  //   const testState = {
  //     nodes: [
  //       { id: 'test', type: 'zfloNode', position: { x: 0, y: 0 }, data: {} },
  //     ],
  //     edges: [],
  //     flowTitle: 'Test Flow',
  //     nodeIdCounter: 5,
  //     edgeIdCounter: 5,
  //   };

  //   const activeFlowId = result.current.activeFlowId;
  //   result.current.saveToLocalStorage(testState, activeFlowId);

  //   expect(localStorageMock.setItem).toHaveBeenCalledWith(
  //     'zflo-editor-multi-flows',
  //     JSON.stringify({flows: {[activeFlowId]: testState}})
  //   );
  // });

  it('should load state from localStorage', () => {
    const testState = {
      nodes: [
        { id: 'test', type: 'zfloNode', position: { x: 0, y: 0 }, data: {} },
      ],
      edges: [],
      flowTitle: 'Saved Flow',
      nodeIdCounter: 3,
      edgeIdCounter: 3,
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(testState));

    const { result } = renderHook(() => useEditorPersistence());
    const loadedState = result.current.loadFromLocalStorage();

    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      'zflo-editor-multi-flows'
    );
    expect(loadedState).toEqual(testState);
  });

  it('should return null when no saved state exists', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useEditorPersistence());
    const loadedState = result.current.loadFromLocalStorage();

    expect(loadedState).toBeNull();
  });

  it('should handle JSON parse errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useEditorPersistence());
    const loadedState = result.current.loadFromLocalStorage();

    expect(loadedState).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load multi-flow state from localStorage:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should clear localStorage', () => {
    const { result } = renderHook(() => useEditorPersistence());

    result.current.clearLocalStorage();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      'zflo-editor-multi-flows'
    );
  });
});
