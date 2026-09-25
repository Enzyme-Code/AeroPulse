import type { Config } from 'tailwindcss'

const fontStack = ['Inter', 'Noto Sans TC', 'sans-serif']

export default {
  content: [
    './app/**/*.{vue,js,ts}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'outline-variant': '#bfc7d2',
        'on-primary-fixed': '#001d31',
        'inverse-on-surface': '#eef0ff',
        'secondary-container': '#7bc2ff',
        'on-primary-container': '#fdfcff',
        'surface-container': '#eaedff',
        'surface-container-low': '#f2f3ff',
        tertiary: '#006947',
        'surface-variant': '#dae2fd',
        'surface-dim': '#d2d9f4',
        'on-secondary': '#ffffff',
        'surface-tint': '#006398',
        'on-surface-variant': '#3f4850',
        'on-tertiary-fixed': '#002113',
        'on-error': '#ffffff',
        outline: '#707881',
        'on-background': '#131b2e',
        'inverse-primary': '#93ccff',
        'primary-container': '#007bb9',
        'on-tertiary-fixed-variant': '#005236',
        secondary: '#006399',
        'secondary-fixed': '#cde5ff',
        primary: '#006194',
        'tertiary-container': '#00855b',
        'on-tertiary': '#ffffff',
        'on-primary-fixed-variant': '#004b73',
        'surface-container-highest': '#dae2fd',
        'on-secondary-container': '#004f7b',
        'primary-fixed': '#cce5ff',
        'surface-container-lowest': '#ffffff',
        'primary-fixed-dim': '#93ccff',
        'on-secondary-fixed-variant': '#004b74',
        'secondary-fixed-dim': '#94ccff',
        'on-error-container': '#93000a',
        'tertiary-fixed-dim': '#4edea3',
        background: '#faf8ff',
        'inverse-surface': '#283044',
        surface: '#faf8ff',
        error: '#ba1a1a',
        'surface-container-high': '#e2e7ff',
        'error-container': '#ffdad6',
        'on-secondary-fixed': '#001d32',
        'surface-bright': '#faf8ff',
        'tertiary-fixed': '#6ffbbe',
        'on-surface': '#131b2e',
        'on-tertiary-container': '#f5fff6',
        'on-primary': '#ffffff'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      spacing: {
        'margin-desktop': '2.5rem',
        'margin-mobile': '1rem',
        'stack-gap': '1rem',
        'container-max': '80rem',
        'section-gap': '1.5rem',
        gutter: '1.25rem',
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem'
      },
      fontFamily: {
        'body-lg': fontStack,
        'body-md': fontStack,
        'body-sm': fontStack,
        'title-md': fontStack,
        'title-sm': fontStack,
        'headline-sm': fontStack,
        'headline-md': fontStack,
        'headline-lg': fontStack,
        'headline-lg-mobile': fontStack,
        'display-hero': fontStack,
        'display-hero-mobile': fontStack,
        'display-temp': fontStack,
        'metric-val': fontStack,
        'label-md': fontStack,
        'label-sm': fontStack
      },
      fontSize: {
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'title-md': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'title-sm': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'headline-sm': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'headline-md': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'headline-lg': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'display-hero': ['64px', { lineHeight: '72px', fontWeight: '700' }],
        'display-hero-mobile': ['48px', { lineHeight: '56px', fontWeight: '700' }],
        'display-temp': ['64px', { lineHeight: '72px', letterSpacing: '-0.04em', fontWeight: '700' }],
        'metric-val': ['32px', { lineHeight: '38px', fontWeight: '700' }],
        'label-md': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '14px', fontWeight: '600' }]
      }
    }
  }
} satisfies Config
