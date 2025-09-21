import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { FlowVizEdge } from '../types/flowviz-types';

export function FlowVizEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: any) {
  const isTraversed = data?.isTraversed || false;
  const label = data?.label;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeStyle = {
    stroke: isTraversed ? '#10b981' : selected ? '#3b82f6' : '#6b7280',
    strokeWidth: isTraversed ? 3 : selected ? 2 : 1.5,
    strokeDasharray: isTraversed ? 'none' : '5,5',
  };

  const shiftY = 24;
  const isGoingUp = targetY < sourceY;
  const adjustedLabelPosY = isGoingUp ? labelY + shiftY : labelY - shiftY;
  const shiftFactorY = shiftY / (targetY - sourceY);
  const shiftFactorX = shiftFactorY * (targetX - sourceX);
  const adjustedLabelPosX = isGoingUp
    ? labelX + shiftFactorX
    : labelX - shiftFactorX;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={edgeStyle} />

      {/* Edge label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${adjustedLabelPosX}px,${adjustedLabelPosY}px)`,
              background: isTraversed ? '#61eeb3' : '#6b7280',
              color: isTraversed ? '#005330' : 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '500',
              fontFamily: 'system-ui, sans-serif',
              pointerEvents: 'all',
              cursor: 'pointer',
              maxWidth: '120px',
              textAlign: 'center',
              wordBreak: 'break-word',
              lineHeight: '1.2',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
