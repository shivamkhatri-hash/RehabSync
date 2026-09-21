import { useTheme } from '../hooks/useTheme';

function SunIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

/**
 * Light / dark theme switch.
 * Layout & motion come from Tailwind utilities; the two theme-critical colours live in
 * index.css (.theme-switch / .theme-switch__thumb) so both palettes stay in one place.
 */
export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={`theme-switch relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ${className}`}
    >
      {/* Inactive mode hint (the active one is covered by the thumb) */}
      <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
        <MoonIcon className="h-3.5 w-3.5 text-slate-400 transition-colors duration-200" />
      </span>
      <span className="pointer-events-none absolute inset-y-0 left-1.5 flex items-center">
        <SunIcon className="h-3.5 w-3.5 text-slate-500 transition-colors duration-200" />
      </span>

      {/* Sliding thumb carrying the active icon */}
      <span
        className={`theme-switch__thumb relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border transition-transform duration-300 ${
          isDark ? 'translate-x-[30px]' : 'translate-x-[2px]'
        }`}
      >
        {isDark ? (
          <MoonIcon className="h-3.5 w-3.5 text-slate-300" />
        ) : (
          <SunIcon className="h-3.5 w-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
}
