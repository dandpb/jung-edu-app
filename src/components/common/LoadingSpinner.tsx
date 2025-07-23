import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className = '',
  text,
  fullScreen = false,
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-gray-600',
    white: 'text-white',
  };

  const spinnerColorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.primary;

  const spinner = (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${spinnerColorClass} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      data-testid="loading-spinner"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      {spinner}
      {text && (
        <p className={`text-sm ${spinnerColorClass}`} data-testid="loading-text">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50"
        data-testid="loading-spinner-fullscreen"
      >
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;