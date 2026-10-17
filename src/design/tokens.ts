/**
 * Design Tokens — Farsi Plus
 * A single source of truth for all design system values.
 * Inspired by Persian art: deep turquoise, saffron gold, soft ivory.
 */

// ─── Color Palette ──────────────────────────────────────────────

// Persian Turquoise (primary) — deep Persian-tile blue
const turquoise = {
  50: '#e6f7f7',
  100: '#cceeee',
  200: '#99dddd',
  300: '#66cccc',
  400: '#33bbbb',
  500: '#0d7377', // main
  600: '#0a5c5f',
  700: '#084a4d',
  800: '#06383a',
  900: '#042528',
  950: '#021214',
};

// Saffron Gold (secondary / accent)
const saffron = {
  50: '#fffaeb',
  100: '#fff3c4',
  200: '#ffe699',
  300: '#ffd966',
  400: '#ffcc33',
  500: '#f5a623', // main
  600: '#d4880e',
  700: '#a86a08',
  800: '#7a4d06',
  900: '#4d2f04',
  950: '#2e1d02',
};

// Warm Ivory (background)
const ivory = {
  50: '#fffef9',
  100: '#fffdf0',
  200: '#fbf5e0',
  300: '#f5ecd0',
  400: '#efe2c0',
  500: '#e8d5b0',
};

// Rose / Coral (for hearts, errors)
const rose = {
  50: '#fff0f0',
  100: '#ffe0e0',
  200: '#ffc7c7',
  300: '#ffa3a3',
  400: '#ff7575',
  500: '#e63946', // main
  600: '#c1303c',
  700: '#9d2630',
  800: '#7a1d25',
  900: '#5a151a',
};

// Emerald (success)
const emerald = {
  50: '#e8f8f0',
  100: '#d0f0e0',
  200: '#a3e0c0',
  300: '#73d09a',
  400: '#3fbf72',
  500: '#22a558', // main
  600: '#1a8747',
  700: '#146838',
  800: '#0f4a28',
  900: '#0a3019',
};

// Amber (warning)
const amber = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b', // main
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
};

// Neutral (gray-brown warm tones)
const neutral = {
  50: '#faf9f7',
  100: '#f5f3f0',
  200: '#e8e4de',
  300: '#d4cdc2',
  400: '#a89e8f',
  500: '#7a7064',
  600: '#5c5447',
  700: '#453e34',
  800: '#2e2922',
  900: '#1a1714',
  950: '#0d0b09',
};

// ─── Exported Tailwind Colors ───────────────────────────────────

export const colors = {
  // Primary — Persian Turquoise
  primary: turquoise,
  // Secondary — Saffron Gold
  secondary: saffron,
  // Accent — Warm Ivory
  accent: ivory,
  // Semantic
  success: emerald,
  warning: amber,
  error: rose,
  // Neutral
  neutral,

  // Convenience aliases
  turquoise,
  saffron,
  ivory,
  rose,
  emerald,
  amber,

  // Dark mode background helpers
  ink: '#0d0b09',
  'ink-soft': '#1a1714',
  'ink-card': '#2e2922',
};

// ─── Typography ─────────────────────────────────────────────────

export const fontFamily = {
  sans: ['Cairo', 'system-ui', 'sans-serif'],
  persian: ['Vazirmatn', 'Cairo', 'sans-serif'],
  vazirmatn: ['Vazirmatn', 'Cairo', 'sans-serif'],
  cairo: ['Cairo', 'system-ui', 'sans-serif'],
  display: ['Cairo', 'system-ui', 'sans-serif'],
};

export const fontSize = {
  'xs': ['0.75rem', { lineHeight: '1.5' }],
  'sm': ['0.875rem', { lineHeight: '1.5' }],
  'base': ['1rem', { lineHeight: '1.5' }],
  'lg': ['1.125rem', { lineHeight: '1.5' }],
  'xl': ['1.25rem', { lineHeight: '1.4' }],
  '2xl': ['1.5rem', { lineHeight: '1.3' }],
  '3xl': ['1.875rem', { lineHeight: '1.2' }],
  '4xl': ['2.25rem', { lineHeight: '1.2' }],
  '5xl': ['3rem', { lineHeight: '1.1' }],
  '6xl': ['3.75rem', { lineHeight: '1.1' }],
};

// ─── Spacing (8px system) ───────────────────────────────────────

export const spacing = {
  '0.5': '2px',
  '1': '4px',
  '1.5': '6px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
};

// ─── Border Radius ──────────────────────────────────────────────

export const borderRadius = {
  'sm': '6px',
  'md': '10px',
  'lg': '16px',
  'xl': '24px',
  '2xl': '32px',
  '3xl': '40px',
  'full': '9999px',
};

// ─── Shadows (soft, layered) ────────────────────────────────────

export const shadows = {
  'xs': '0 1px 2px rgba(13, 11, 9, 0.05)',
  'sm': '0 2px 4px rgba(13, 11, 9, 0.06), 0 1px 2px rgba(13, 11, 9, 0.04)',
  'md': '0 4px 12px rgba(13, 11, 9, 0.08), 0 2px 4px rgba(13, 11, 9, 0.04)',
  'lg': '0 8px 24px rgba(13, 11, 9, 0.10), 0 4px 8px rgba(13, 11, 9, 0.06)',
  'xl': '0 16px 40px rgba(13, 11, 9, 0.12), 0 8px 16px rgba(13, 11, 9, 0.08)',
  '2xl': '0 24px 56px rgba(13, 11, 9, 0.16)',
  'inner': 'inset 0 2px 4px rgba(13, 11, 9, 0.06)',
  'glow-primary': '0 0 24px rgba(13, 115, 119, 0.3)',
  'glow-saffron': '0 0 24px rgba(245, 166, 35, 0.3)',
  'glow-success': '0 0 24px rgba(34, 165, 88, 0.3)',
  'glow-error': '0 0 24px rgba(230, 57, 70, 0.3)',
};
