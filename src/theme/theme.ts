import { Platform } from 'react-native';

// Light mode palette
export const palette = {
  // Backgrounds & surfaces
  parchment: '#f2efe8',
  ivory: '#faf9f5',
  white: '#ffffff',
  warmSand: '#e8e5dc',
  surfaceVariant: '#f1dfd9',

  // Text
  nearBlack: '#141413',
  charcoalWarm: '#4d4c48',
  oliveGray: '#5e5d59',
  stoneGray: '#87867f',
  warmSilver: '#b0aea5',

  // Borders & rings
  borderCream: '#e6e3da',
  borderWarm: '#dbd8cf',
  ringWarm: '#cfccc3',

  // Brand & semantic
  terracotta: '#c96442',
  brandDark: '#d4693e',
  coral: '#d97757',
  errorCrimson: '#b53333',
  focusBlue: '#3898ec',

  // Dark mode — warmer and lighter for better readability
  bgDark: '#2d2a26',
  surfaceDark: '#3a3632',
  surfaceDarkRaised: '#45413d',
  surfaceDarkBar: '#34302c',
  surfaceDarkActive: '#504c47',
  textDarkPrimary: '#f5f2eb',
  textDarkSecondary: '#c4c0b5',
  textDarkTertiary: '#958f85',
  borderDark: '#4a4640',
  borderDarkStrong: '#58544e',
};

// Typography
export const fonts = {
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }) as string,
  serifMedium: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }) as string,
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }) as string,
};

// Backwards-compat export for any leftover imports
export const typography = fonts;

// Type scale (matches stitch design system tokens)
export const text = {
  displayHero: {
    fontFamily: fonts.serif,
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '500' as const,
  },
  sectionHeading: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '500' as const,
  },
  subHeadingLg: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '500' as const,
  },
  subHeading: {
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '500' as const,
  },
  featureTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  bodyLarge: {
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400' as const,
  },
  bodyStandard: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyUiBold: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.12,
  },
  overline: {
    fontFamily: fonts.sans,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
  },
};

// Spacing scale (8px base)
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  section: 40,
  sectionLg: 64,
};

// Radius scale
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 32,
  full: 9999,
};

/**
 * Resolve a theme-aware color object based on dark mode toggle.
 */
export function getThemeColors(dark: boolean) {
  return dark
    ? {
        background: palette.bgDark,
        surface: palette.surfaceDark,
        surfaceRaised: palette.surfaceDarkRaised,
        surfaceActive: palette.surfaceDarkActive,
        textPrimary: palette.textDarkPrimary,
        textSecondary: palette.textDarkSecondary,
        textTertiary: palette.textDarkTertiary,
        border: palette.borderDark,
        borderStrong: palette.borderDarkStrong,
        brand: palette.brandDark,
        brandText: palette.ivory,
        error: palette.errorCrimson,
        focusRing: palette.focusBlue,
        tabBarBg: palette.surfaceDarkBar,
        secondaryButtonBg: palette.surfaceDarkActive,
        secondaryButtonText: palette.textDarkPrimary,
      }
    : {
        background: palette.parchment,
        surface: palette.ivory,
        surfaceRaised: palette.white,
        surfaceActive: palette.warmSand,
        textPrimary: palette.nearBlack,
        textSecondary: palette.oliveGray,
        textTertiary: palette.stoneGray,
        border: palette.borderCream,
        borderStrong: palette.borderWarm,
        brand: palette.terracotta,
        brandText: palette.ivory,
        error: palette.errorCrimson,
        focusRing: palette.focusBlue,
        tabBarBg: palette.parchment,
        secondaryButtonBg: palette.warmSand,
        secondaryButtonText: palette.charcoalWarm,
      };
}

export type ThemeColors = ReturnType<typeof getThemeColors>;
