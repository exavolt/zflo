import { cn } from '@/lib/utils';
import { Handle, HandleProps, useNodeConnections } from '@xyflow/react';

export const ZEdHandle = ({ className, ...props }: HandleProps) => {
  const connections = useNodeConnections({
    handleType: props.type,
    handleId: props.id === null ? undefined : props.id,
  });

  return (
    <Handle
      {...props}
      isConnectable={props.type === 'source' ? connections.length === 0 : true}
      className={cn(
        props.type === 'source'
          ? '!bg-gray-500 !border-none !size-[9px]'
          : '!bg-white !border-[1.5px] !border-gray-500 !hover:border-gray-500 !size-[10px]',
        '!hover:bg-gray-500 rounded-full',
        className
      )}
    />
  );
};
