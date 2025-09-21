import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowEditor } from '../flow-editor';
import React from 'react';

// Mock the hooks and converters
vi.mock('@/hooks/use-editor-persistence', () => ({
  useEditorPersistence: () => ({
    saveToLocalStorage: vi.fn(),
    loadFromLocalStorage: vi.fn(() => null),
    clearLocalStorage: vi.fn(),
  }),
}));

vi.mock('@/lib/converters/reactflow-to-zflo', () => ({
  convertReactFlowToZFlo: vi.fn(() => ({
    id: 'test-flow',
    title: 'Test Flow',
    nodes: [],
    startNodeId: '',
  })),
}));

// Mock ReactFlow components
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react');
  return {
    ...actual,
    ReactFlow: ({ children }: any) => (
      <div data-testid="react-flow">{children}</div>
    ),
    Background: () => <div data-testid="background" />,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    useReactFlow: () => ({
      screenToFlowPosition: vi.fn(() => ({ x: 0, y: 0 })),
    }),
    useNodesState: () => [[], vi.fn(), vi.fn()],
    useEdgesState: () => [[], vi.fn(), vi.fn()],
    addEdge: vi.fn(),
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FileDown: () => <div data-testid="file-down-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Play: () => <div data-testid="play-icon" />,
  XIcon: () => <div data-testid="x-icon" />,
  CheckIcon: () => <div data-testid="check-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  X: () => <div data-testid="x-icon" />,
  SquarePenIcon: () => <div data-testid="pen-icon" />,
  RotateCcw: () => <div data-testid="rotate-icon" />,
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Save: () => <div data-testid="save-icon" />,
  FolderOpen: () => <div data-testid="folder-open-icon" />,
  Share: () => <div data-testid="share-icon" />,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon" />,
  Code: () => <div data-testid="code-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  Download: () => <div data-testid="download-icon" />,
  CopyIcon: () => <div data-testid="copy-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  CloudDownloadIcon: () => <div data-testid="cloud-download-icon" />,
  CloudUploadIcon: () => <div data-testid="cloud-upload-icon" />,
}));

// Mock @zflo/core
vi.mock('@zflo/core', () => ({
  inferNodeTypes: vi.fn(() => ({})),
}));

// Mock @zflo/ui-react-tw
vi.mock('@zflo/ui-react-tw', () => ({
  FlowPlayer: ({ flowchart, className }: any) => (
    <div data-testid="flow-player" className={className}>
      Flow Player: {flowchart?.title || 'Untitled'}
    </div>
  ),
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid'),
}));

const renderWithProvider = (component: React.ReactNode) => {
  return render(<ReactFlowProvider>{component}</ReactFlowProvider>);
};

describe('FlowEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the editor with header and main components', () => {
    renderWithProvider(<FlowEditor />);

    // Check header elements
    // expect(screen.getByPlaceholderText('Flow Title')).toBeInTheDocument();
    expect(screen.getByTestId('play-icon')).toBeInTheDocument();
    expect(screen.getByTestId('file-text-icon')).toBeInTheDocument();
    // expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    // expect(screen.getByTestId('file-down-icon')).toBeInTheDocument();

    // Check main flow editor
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    expect(screen.getByTestId('background')).toBeInTheDocument();
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
  });

  // it('should update flow title when input changes', () => {
  //   renderWithProvider(<FlowEditor />);

  //   const titleInput = screen.getByPlaceholderText('Flow Title');
  //   fireEvent.change(titleInput, { target: { value: 'My Custom Flow' } });

  //   expect(titleInput).toHaveValue('My Custom Flow');
  // });

  it('should open preview dialog when clicking preview button', async () => {
    renderWithProvider(<FlowEditor />);

    const previewButton = screen.getByTestId('play-icon').closest('button');
    fireEvent.click(previewButton!);

    await waitFor(() => {
      expect(screen.getByText('Playtest')).toBeInTheDocument();
      expect(screen.getByTestId('flow-player')).toBeInTheDocument();
    });
  });

  // it('should open view code dialog when clicking view code button', async () => {
  //   renderWithProvider(<FlowEditor />);

  //   const viewCodeButton = screen
  //     .getByTestId('file-text-icon')
  //     .closest('button');
  //   fireEvent.click(viewCodeButton!);

  //   await waitFor(() => {
  //     expect(screen.getByText('View Code')).toBeInTheDocument();
  //   });
  // });

  // it('should have clear button with destructive styling', () => {
  //   renderWithProvider(<FlowEditor />);

  //   const clearButton = screen.getByTestId('trash-icon').closest('button');
  //   expect(clearButton).toHaveClass('text-destructive');
  //   expect(screen.getByText('Clear')).toBeInTheDocument();
  // });

  // it('should have export button', () => {
  //   renderWithProvider(<FlowEditor />);

  //   const exportButton = screen.getByTestId('file-down-icon').closest('button');
  //   expect(exportButton).toBeInTheDocument();
  //   expect(screen.getByText('Export')).toBeInTheDocument();
  // });

  // it('should render with default flow title', () => {
  //   renderWithProvider(<FlowEditor />);

  //   const titleInput = screen.getByPlaceholderText('Flow Title');
  //   expect(titleInput).toHaveValue('New Flow');
  // });
});
