import React from 'react';

export interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  theme?: 'light' | 'dark';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  className = '',
  theme = 'light',
}) => {
  return (
    <div className={`zflo-loading ${theme} ${className}`}>
      <div className="zflo-spinner" />
      <span className="zflo-loading-message">{message}</span>
    </div>
  );
};
