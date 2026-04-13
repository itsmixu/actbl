import { Platform } from 'react-native';

export const palette = {
  nearBlack: '#141413',
  darkSurface: '#30302e',
  terracotta: '#c96442',
  coral: '#d97757',
  parchment: '#f5f4ed',
  ivory: '#faf9f5',
  white: '#ffffff',
  warmSand: '#e8e6dc',
  borderCream: '#f0eee6',
  borderWarm: '#e8e6dc',
  charcoalWarm: '#4d4c48',
  oliveGray: '#5e5d59',
  stoneGray: '#87867f',
  warmSilver: '#b0aea5',
  errorCrimson: '#b53333',
  focusBlue: '#3898ec',
};

export const typography = {
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
};
