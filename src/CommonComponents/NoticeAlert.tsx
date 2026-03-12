'use client';

import React from 'react';
import { Info } from 'react-feather';

export interface NoticeAlertProps {
  /** Notice text describing the page or section functionality. */
  notice: string;
  /** Optional className for the wrapper. */
  className?: string;
}

/**
 * Reusable notice alert with brand icon. Uses theme primary color, responsive, company brand.
 * Use under page/section labels to describe functionality.
 */
export default function NoticeAlert({ notice, className = '' }: NoticeAlertProps) {
  return (
    <div
      className={`page-notice-alert ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <span className="page-notice-alert__icon" aria-hidden>
        <Info size={20} />
      </span>
      <p className="page-notice-alert__text mb-0">{notice}</p>
    </div>
  );
}
