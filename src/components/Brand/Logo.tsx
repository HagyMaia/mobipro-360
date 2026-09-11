'use client';

import React from 'react';
import { Navigation } from 'lucide-react';
import { cn } from '@/lib/cn';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  subtitle?: string;
  className?: string;
  lightText?: boolean;
}

export function Logo({
  size = 'md',
  variant = 'full',
  subtitle = 'MOTORISTA',
  className,
  lightText = false,
}: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-3xl',
  };

  const navIconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
    xl: 32,
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl',
  };

  const badgeSizes = {
    sm: 'text-[8px] px-1.5 py-0.2',
    md: 'text-[9px] px-2 py-0.5',
    lg: 'text-[10px] px-2.5 py-0.5',
    xl: 'text-xs px-3 py-1',
  };

  const iconElement = (
    <div
      className={cn(
        'relative flex items-center justify-center font-black shrink-0 select-none shadow-lg overflow-hidden',
        'bg-gradient-to-tr from-[#0D192C] to-[#070D18]',
        'border border-amber-400/50 shadow-amber-500/10',
        iconSizes[size]
      )}
    >
      <svg className="w-full h-full p-1" viewBox="0 0 512 512">
        <circle
          cx="256"
          cy="256"
          r="210"
          fill="none"
          stroke="#FFC800"
          strokeWidth="24"
          strokeDasharray="24 18"
          strokeLinecap="round"
        />
        <path
          d="M256 80 C175 80 110 145 110 226 C110 320 256 420 256 420 C256 420 402 320 402 226 C402 145 337 80 256 80 Z"
          fill="#FFC800"
        />
        <circle cx="256" cy="216" r="56" fill="#070D18" />
        <text
          x="256"
          y="233"
          fill="#FFC800"
          fontSize="52"
          fontWeight="900"
          textAnchor="middle"
          fontFamily="sans-serif"
          letterSpacing="1"
        >
          SR
        </text>
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return <div className={cn('inline-flex items-center', className)}>{iconElement}</div>;
  }

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      {iconElement}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'font-black tracking-wider uppercase leading-none',
              lightText ? 'text-white' : 'text-slate-900 dark:text-white',
              textSizes[size]
            )}
          >
            SR Logística
          </span>
          {subtitle && (
            <span
              className={cn(
                'rounded-md font-black tracking-widest uppercase bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-sm',
                badgeSizes[size]
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Logo;
