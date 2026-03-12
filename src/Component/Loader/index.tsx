'use client';

import React from 'react';

export type AppLoaderSize = 'sm' | 'md' | 'lg';

export interface AppLoaderProps {
  /** Size variant: sm (inline/buttons), md (default), lg (full section) */
  size?: AppLoaderSize;
  /** Optional class for wrapper */
  className?: string;
  /** Optional aria-label for accessibility */
  'aria-label'?: string;
}

/**
 * Reusable fancy loader using the app primary color.
 * Use everywhere for consistent loading states.
 */
export function AppLoader({
  size = 'md',
  className = '',
  'aria-label': ariaLabel = 'Loading',
}: AppLoaderProps) {
  return (
    <div
      className={`app-loader app-loader--${size} ${className}`.trim()}
      role="status"
      aria-label={ariaLabel}
    >
      <div className="app-loader__circle" />
    </div>
  );
}

export default AppLoader;
