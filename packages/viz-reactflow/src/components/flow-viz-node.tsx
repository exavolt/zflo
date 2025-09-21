// Removed Handle import - using handleless nodes for cleaner look
import { Handle, Position } from '@xyflow/react';
import type { FlowVizNode } from '../types/flowviz-types';

export function FlowVizNode({ data, selected }: any) {
  const { xfNode, isCurrentNode, isTraversed, truncatedContent } = data;

  const getNodeStyle = () => {
    if (isCurrentNode) {
      return {
        background: '#3b82f6',
        border: '2px solid #1d4ed8',
        color: 'white',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
      };
    }

    if (isTraversed) {
      return {
        background: '#10b981',
        border: '2px solid #059669',
        color: 'white',
      };
    }

    return {
      background: 'white',
      border: selected ? '2px solid #3b82f6' : '2px solid #e5e7eb',
      color: '#374151',
    };
  };

  return (
    <div
      style={{
        ...getNodeStyle(),
        padding: '12px 16px',
        borderRadius: '8px',
        width: '300px',
        height: '80px',
        fontSize: '14px',
        fontFamily: 'system-ui, sans-serif',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      {/* Node header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '8px',
          fontWeight: '600',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {xfNode.title}
        </span>
      </div>

      {/* Node content */}
      {truncatedContent && (
        <div
          style={{
            fontSize: '12px',
            lineHeight: '1.4',
            opacity: 0.9,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {truncatedContent}
        </div>
      )}

      {data.nodeType != 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            left: '50%',
            top: '-10px',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            border: 'none',
            background: '#3b82f6',
          }}
        />
      )}

      {data.nodeType != 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            left: '50%',
            bottom: '-10px',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            border: 'none',
            background: '#3b82f6',
          }}
        />
      )}
    </div>
  );
}
