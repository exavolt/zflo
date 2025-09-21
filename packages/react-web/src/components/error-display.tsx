import React from 'react';

export interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
  className?: string;
  theme?: 'light' | 'dark';
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  className = '',
  theme = 'light',
}) => {
  return (
    <div className={`zflo-error ${theme} ${className}`}>
      <div className="zflo-error-icon">⚠️</div>
      <h3 className="zflo-error-title">Something went wrong</h3>
      <p className="zflo-error-message">{error.message}</p>
      {onRetry && (
        <button onClick={onRetry} className="zflo-retry-button">
          Try Again
        </button>
      )}
    </div>
  );
};
