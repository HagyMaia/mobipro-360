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
          cy="234"
          r="190"
          fill="none"
          stroke="#FFC800"
          strokeWidth="20"
          strokeDasharray="20 16"
          strokeLinecap="round"
        />
        {/* Roof taxi sign */}
        <rect x="200" y="80" width="112" height="36" rx="10" fill="#FFC800" />
        <rect x="210" y="86" width="92" height="24" rx="6" fill="#070D18" />
        <text x="256" y="103" fill="#FFC800" fontSize="16" fontWeight="900" textAnchor="middle" letterSpacing="1">TAXI</text>
        <rect x="236" y="116" width="40" height="10" rx="2" fill="#E5A800" />
        {/* Car cabin */}
        <path d="M150 230 L185 126 C192 116 206 110 218 110 L294 110 C306 110 320 116 327 126 L362 230 Z" fill="#FFC800" />
        <path d="M164 222 L194 130 C198 124 206 120 214 120 L298 120 C306 120 314 124 318 130 L348 222 Z" fill="#070D18" />
        {/* Car body */}
        <path d="M118 240 C106 244 98 256 100 270 L106 330 C108 342 118 350 130 350 L152 350 C160 350 166 342 166 334 L166 322 L346 322 L346 334 C346 342 352 350 360 350 L382 350 C394 350 404 342 406 330 L412 270 C414 256 406 244 394 240 C360 230 308 226 256 226 C204 226 152 230 118 240 Z" fill="#FFC800" />
        {/* Headlights */}
        <path d="M114 262 C124 262 154 266 162 278 C156 286 130 290 114 284 Z" fill="#070D18" stroke="#FFE066" strokeWidth="3" />
        <path d="M398 262 C388 262 358 266 350 278 C356 286 382 290 398 284 Z" fill="#070D18" stroke="#FFE066" strokeWidth="3" />
        {/* Grille & SR Badge */}
        <rect x="186" y="266" width="140" height="48" rx="10" fill="#070D18" stroke="#FFE066" strokeWidth="2.5" />
        <rect x="236" y="278" width="40" height="24" rx="6" fill="#FFC800" />
        <text x="256" y="295" fill="#070D18" fontSize="15" fontWeight="900" textAnchor="middle">SR</text>
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
