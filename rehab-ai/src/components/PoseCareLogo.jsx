import React from 'react';

/**
 * PoseCare Official Brand Logo Component
 * 
 * @param {Object} props
 * @param {'full' | 'horizontal' | 'icon'} [props.variant='horizontal'] - Logo display style
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='md'] - Sizing preset
 * @param {'light' | 'dark'} [props.theme='light'] - Theme mode (dark changes navy text/emblem to white/ice blue)
 * @param {string} [props.className] - Additional class names
 * @param {boolean} [props.withTagline] - Whether to show "YOUR MOVEMENT. OUR SUPPORT." tagline
 */
export default function PoseCareLogo({
  variant = 'horizontal',
  size = 'md',
  theme = 'light',
  className = '',
  withTagline = false
}) {
  const isDark = theme === 'dark';
  const navyColor = isDark ? '#FFFFFF' : '#0B2B47';
  const taglineColor = isDark ? '#94A3B8' : '#0B2B47';

  // Size configurations
  const heightClasses = {
    sm: variant === 'full' || withTagline ? 'h-9' : 'h-7',
    md: variant === 'full' || withTagline ? 'h-12' : 'h-9',
    lg: variant === 'full' || withTagline ? 'h-16' : 'h-12',
    xl: variant === 'full' || withTagline ? 'h-24' : 'h-16',
  }[size] || 'h-9';

  if (variant === 'icon') {
    const iconDim = {
      sm: 'w-7 h-7',
      md: 'w-9 h-9',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16'
    }[size] || 'w-9 h-9';

    return (
      <div className={`inline-flex items-center justify-center ${iconDim} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="iconGlowComp" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2DD4BF" />
              <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>
          </defs>
          <g transform="translate(50, 50)">
            <circle cx="0" cy="0" r="46" fill="url(#iconGlowComp)" />
            <path 
              d="M -46 0 A 46 46 0 0 1 46 0 A 46 46 0 0 1 26 38 L 13 22 A 26 26 0 0 0 26 0 A 26 26 0 0 0 -26 0 A 26 26 0 0 0 -13 22 L -26 38 A 46 46 0 0 1 -46 0 Z" 
              fill={navyColor} 
            />
            <circle cx="0" cy="-14" r="9.5" fill="#FFFFFF" />
            <path 
              d="M -21 -5 C -16 8, -8 16, -5 46 L 5 46 C 8 16, 16 8, 21 -5 C 23.5 -11.5, 17 -17, 12 -12 C 8 -8, 5 4, 0 4 C -5 4, -8 -8, -12 -12 C -17 -17, -23.5 -11.5, -21 -5 Z" 
              fill="#FFFFFF" 
            />
          </g>
        </svg>
      </div>
    );
  }

  // Full or horizontal SVG vector rendering
  const showTagline = variant === 'full' || withTagline;
  const viewBox = showTagline ? "0 0 520 140" : "0 0 520 105";

  return (
    <div className={`inline-flex items-center ${heightClasses} ${className}`}>
      <svg 
        viewBox={viewBox} 
        className="h-full w-auto drop-shadow-sm transition-all" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`tealGrad_${theme}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="35%" stopColor="#0EA5E9" />
            <stop offset="65%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          <linearGradient id={`emblemGrad_${theme}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>
        </defs>

        <g transform="translate(10, 8)">
          {/* 'P' */}
          <path 
            d="M 12 18 L 48 18 C 62 18 72 26 72 38 C 72 50 62 58 48 58 L 30 58 L 30 88 L 12 88 Z M 30 34 L 30 42 L 46 42 C 51 42 54 39.5 54 36 C 54 32.5 51 30 46 30 L 30 30 Z" 
            fill={navyColor} 
          />

          {/* 'O' Emblem */}
          <g transform="translate(112, 53)">
            <circle cx="0" cy="0" r="35" fill={`url(#emblemGrad_${theme})`} />
            <path 
              d="M -35 0 A 35 35 0 0 1 35 0 A 35 35 0 0 1 20 28.5 L 10 17 A 20 20 0 0 0 20 0 A 20 20 0 0 0 -20 0 A 20 20 0 0 0 -10 17 L -20 28.5 A 35 35 0 0 1 -35 0 Z" 
              fill={navyColor} 
            />
            <circle cx="0" cy="-11" r="7" fill="#FFFFFF" />
            <path 
              d="M -16 -4 C -12 6, -6 12, -4 35 L 4 35 C 6 12, 12 6, 16 -4 C 18 -9, 13 -13, 9 -9 C 6 -6, 4 3, 0 3 C -4 3, -6 -6, -9 -9 C -13 -13, -18 -9, -16 -4 Z" 
              fill="#FFFFFF" 
            />
          </g>

          {/* 'S' */}
          <path 
            d="M 198 28 C 190 20 178 18 168 18 C 152 18 142 27 142 39 C 142 59 184 55 184 70 C 184 76 177 80 167 80 C 154 80 144 73 138 65 L 125 76 C 134 89 149 96 167 96 C 187 96 201 84 201 69 C 201 48 159 52 159 38 C 159 33 164 29 170 29 C 179 29 187 34 191 40 Z" 
            fill={navyColor} 
          />

          {/* 'E' */}
          <path 
            d="M 216 18 L 260 18 L 260 33 L 233 33 L 233 46 L 257 46 L 257 60 L 233 60 L 233 73 L 261 73 L 261 88 L 216 88 Z" 
            fill={`url(#tealGrad_${theme})`} 
          />

          {/* 'C' */}
          <path 
            d="M 326 32 C 318 22 305 18 291 18 C 269 18 253 34 253 53 C 253 72 269 88 291 88 C 305 88 318 84 326 74 L 314 62 C 308 68 299 72 291 72 C 279 72 270 63 270 53 C 270 43 279 34 291 34 C 299 34 308 38 314 44 Z" 
            fill={`url(#tealGrad_${theme})`} 
          />

          {/* 'A' */}
          <path 
            d="M 348 18 L 330 88 L 348 88 L 354 69 L 378 69 L 384 88 L 402 88 L 384 18 Z M 366 32 L 374 55 L 358 55 Z" 
            fill={`url(#tealGrad_${theme})`} 
          />

          {/* 'R' */}
          <path 
            d="M 408 18 L 439 18 C 452 18 460 25 460 36 C 460 45 454 51 445 54 L 464 88 L 444 88 L 428 58 L 425 58 L 425 88 L 408 88 Z M 425 32 L 425 45 L 438 45 C 443 45 446 42 446 38.5 C 446 35 443 32 438 32 Z" 
            fill={`url(#tealGrad_${theme})`} 
          />

          {/* 'E' */}
          <path 
            d="M 470 18 L 512 18 L 512 33 L 487 33 L 487 46 L 509 46 L 509 60 L 487 60 L 487 73 L 513 73 L 513 88 L 470 88 Z" 
            fill={`url(#tealGrad_${theme})`} 
          />

          {/* Tagline */}
          {showTagline && (
            <text 
              x="260" 
              y="118" 
              textAnchor="middle" 
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
              fontSize="14" 
              fontWeight="800" 
              letterSpacing="5.5" 
              fill={taglineColor}
            >
              YOUR MOVEMENT. OUR SUPPORT.
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}
