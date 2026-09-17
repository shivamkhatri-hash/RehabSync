import React from 'react';

/**
 * PoseCare Official Brand Logo Component
 * 
 * @param {Object} props
 * @param {'full' | 'horizontal' | 'icon'} [props.variant='full'] - Logo display style
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='md'] - Sizing preset
 * @param {'light' | 'dark'} [props.theme='light'] - Theme mode
 * @param {string} [props.className] - Additional class names
 */
export default function PoseCareLogo({
  variant = 'full',
  size = 'md',
  theme = 'light',
  className = ''
}) {
  const isDark = theme === 'dark';

  // Size heights
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10 md:h-11',
    lg: 'h-14 md:h-16',
    xl: 'h-20 md:h-24'
  }[size] || 'h-10';

  if (variant === 'icon') {
    const iconDim = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-14 h-14',
      xl: 'w-20 h-20'
    }[size] || 'w-10 h-10';

    return (
      <img 
        src="/posecare-icon.png" 
        alt="PoseCare Emblem" 
        className={`inline-block rounded-full object-contain ${iconDim} ${className}`}
      />
    );
  }

  // Full brand logo (with "POSECARE" typography & "YOUR MOVEMENT. OUR SUPPORT." tagline)
  if (isDark) {
    return (
      <div className={`inline-flex items-center bg-white/95 px-3 py-1.5 rounded-xl shadow-sm border border-slate-700/40 backdrop-blur-sm ${className}`}>
        <img 
          src="/posecare-logo-transparent-2x.png" 
          alt="PoseCare — Your Movement. Our Support." 
          className={`${heightClasses} w-auto object-contain select-none`}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <img 
        src="/posecare-logo-transparent-2x.png" 
        alt="PoseCare — Your Movement. Our Support." 
        className={`${heightClasses} w-auto object-contain select-none transition-transform hover:scale-[1.02]`}
      />
    </div>
  );
}
