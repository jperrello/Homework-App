// Enhanced Theme System with Design Tokens
// Extends the existing theme from constants with proper design system structure

import { THEME as BASE_THEME } from '../constants';

// Typography Scale
export const typography = {
  families: {
    primary: 'System', // Using system font for Expo compatibility
    monospace: 'Courier New',
  },
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  sizes: {
    xs: 12,
    sm: 14, 
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Extended Color Palette
export const colors = {
  ...BASE_THEME.colors,
  
  // Extended palette with semantic colors
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE', 
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    900: '#1E3A8A',
  },
  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    900: '#4C1D95',
  },
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    900: '#064E3B',
  },
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    900: '#78350F',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    900: '#7F1D1D',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

// Spacing Scale
export const spacing = {
  ...BASE_THEME.spacing,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '9': 36,
  '10': 40,
  '12': 48,
  '16': 64,
  '20': 80,
  '24': 96,
} as const;

// Border Radius Scale  
export const radii = {
  ...BASE_THEME.borderRadius,
  none: 0,
  xs: 2,
  sm: 4,
  base: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// Shadow Definitions
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  cosmic: {
    shadowColor: BASE_THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// Z-Index Scale
export const zIndices = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  sm: 360,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// Component Variants
export const variants = {
  button: {
    primary: {
      backgroundColor: BASE_THEME.colors.primary,
      color: '#FFFFFF',
    },
    secondary: {
      backgroundColor: BASE_THEME.colors.secondary,
      color: '#FFFFFF', 
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: BASE_THEME.colors.primary,
      color: BASE_THEME.colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: BASE_THEME.colors.primary,
    },
  },
  text: {
    heading: {
      fontWeight: typography.weights.bold,
      color: BASE_THEME.colors.text,
    },
    body: {
      fontWeight: typography.weights.regular,
      color: BASE_THEME.colors.text,
    },
    caption: {
      fontWeight: typography.weights.regular,
      color: BASE_THEME.colors.textSecondary,
    },
  },
} as const;

// Complete theme object
export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  zIndices,
  breakpoints,
  variants,
  
  // Backward compatibility with existing THEME
  ...BASE_THEME,
} as const;

export type Theme = typeof theme;
export type ThemeColors = typeof colors;
export type ThemeSpacing = typeof spacing;

export default theme;