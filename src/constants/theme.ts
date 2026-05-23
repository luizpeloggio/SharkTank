/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',              // Slate 900
    background: '#F1F5F9',        // Off-white canvas
    backgroundElement: '#FFFFFF', // Pure white card
    backgroundSelected: '#E2E8F0', // Slate 200 selection
    textSecondary: '#475569',     // Slate 600 subtext
    primary: '#353C7C',           // Strict brand blue
    border: '#E2E8F0',            // Slate 200 borders
  },
  dark: {
    text: '#FFFFFF',
    background: '#090D16',         // Deep slate dark background
    backgroundElement: '#131C2E',  // Card background
    backgroundSelected: '#202D44', // Card selected state
    textSecondary: '#94A3B8',      // Soft subtext
    primary: '#353C7C',           // Strict brand blue
    border: '#1E293B',             // Slate 800 borders
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
