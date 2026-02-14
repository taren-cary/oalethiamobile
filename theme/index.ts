/**
 * Glassmorphism theme: colors, typography, spacing, border radius.
 * Used by glass components and cosmic UI. See .cursor/rules/Glassmorphism-Design-Rules.mdc.
 */

export const glassColors = {
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.15)',
    strong: 'rgba(255, 255, 255, 0.2)',
    extraStrong: 'rgba(255, 255, 255, 0.25)',
  },
  glassBorder: {
    default: 'rgba(255, 255, 255, 0.2)',
    active: 'rgba(255, 255, 255, 0.4)',
    subtle: 'rgba(255, 255, 255, 0.1)',
  },
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    disabled: 'rgba(255, 255, 255, 0.3)',
  },
  background: {
    primary: '#0a0a0f',
    secondary: '#1a1a2e',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  gradientBorder: ['rgba(99, 102, 241, 0.5)', 'rgba(139, 92, 246, 0.5)'],
  progressBar: ['#6366f1', '#8b5cf6'] as [string, string],
} as const;

export const glassTypography = {
  h1: { fontFamily: 'Orbitron_700Bold', fontSize: 32, lineHeight: 40 },
  h2: { fontFamily: 'Orbitron_700Bold', fontSize: 28, lineHeight: 36 },
  h3: { fontFamily: 'Orbitron_600SemiBold', fontSize: 24, lineHeight: 32 },
  h4: { fontFamily: 'Orbitron_600SemiBold', fontSize: 20, lineHeight: 28 },
  h5: { fontFamily: 'Orbitron_600SemiBold', fontSize: 18, lineHeight: 24 },
  bodyLarge: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
  bodySmall: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20 },
  labelSmall: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16 },
  navLabel: { fontFamily: 'Orbitron_500Medium', fontSize: 10, lineHeight: 12 },
} as const;

export const glassSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  cardPadding: 20,
  screenPadding: 20,
  sectionGap: 24,
  itemGap: 16,
} as const;

export const glassBorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
  card: 20,
  button: 16,
  input: 12,
  navCircle: 30,
} as const;

export const blurIntensity = {
  light: 10,
  medium: 20,
  strong: 30,
} as const;
