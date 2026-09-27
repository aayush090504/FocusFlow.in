import React from 'react';
import { Timer } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
  size?: number | string;
  iconClassName?: string;
  withContainer?: boolean;
  containerClassName?: string;
}

/**
 * Custom bespoke Stopwatch / Study Timer vector logo for Focus Flow.
 * Combines stopwatch pushers, a circular dial, focus flow tick marks,
 * and high-precision timer hands.
 */
export const TimerLogoSvg: React.FC<{ className?: string; size?: number | string }> = ({
  className = 'w-6 h-6',
  size
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Top Stopwatch button / pusher */}
      <line x1="10" y1="2" x2="14" y2="2" />
      <line x1="12" y1="2" x2="12" y2="5" />
      
      {/* Top right secondary pusher for precision lap/split feel */}
      <line x1="18.5" y1="4.5" x2="17" y2="6" strokeWidth="2" />

      {/* Stopwatch main circular housing */}
      <circle cx="12" cy="14" r="8" />

      {/* Focus Timer active hands (12:00 up and 2:15 flow angle) */}
      <line x1="12" y1="14" x2="12" y2="9.5" />
      <line x1="12" y1="14" x2="15.5" y2="12" />

      {/* Center pivot dot */}
      <circle cx="12" cy="14" r="1.2" fill="currentColor" />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  iconClassName = 'w-5 h-5',
  withContainer = false,
  containerClassName = 'w-9 h-9 rounded-xl flex items-center justify-center shadow-md',
}) => {
  if (withContainer) {
    return (
      <div 
        className={`${containerClassName} ${className}`}
        style={{
          backgroundColor: 'var(--color-accent-primary)',
          color: 'var(--color-accent-fg)'
        }}
      >
        <TimerLogoSvg className={iconClassName} />
      </div>
    );
  }

  return <TimerLogoSvg className={`${iconClassName} ${className}`} />;
};

export default BrandLogo;
