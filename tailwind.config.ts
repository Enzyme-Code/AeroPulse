import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,js,ts}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface-container-lowest': '#ffffff',
        'inverse-on-surface': '#eaf1ff',
        'surface-container': '#e5eeff',
        secondary: '#2f6388',
        error: '#ba1a1a',
        'on-secondary-container': '#275c81',
        'on-tertiary-fixed-variant': '#43474b',
        'surface-container-highest': '#d3e4fe',
        'surface-dim': '#cbdbf5',
        'primary-fixed-dim': '#7bd0ff',
        'on-tertiary-fixed': '#171c1f',
        'surface-bright': '#f8f9ff',
        'surface-variant': '#d3e4fe',
        background: '#f8f9ff',
        'on-tertiary': '#ffffff',
        'inverse-primary': '#7bd0ff',
        tertiary: '#5a5f62',
        'outline-variant': '#bdc8d1',
        primary: '#00668a',
        'on-primary-fixed-variant': '#004c69',
        'tertiary-fixed-dim': '#c3c7cb',
        'tertiary-container': '#adb2b6',
        'secondary-container': '#a3d4ff',
        'surface-container-low': '#eff4ff',
        'on-secondary-fixed': '#001e30',
        outline: '#6e7980',
        'on-error': '#ffffff',
        'on-surface-variant': '#3e484f',
        'on-primary-fixed': '#001e2c',
        'on-surface': '#0b1c30',
        'on-secondary': '#ffffff',
        'on-background': '#0b1c30',
        'tertiary-fixed': '#dfe3e7',
        'primary-fixed': '#c4e7ff',
        'on-tertiary-container': '#404548',
        'surface-container-high': '#dce9ff',
        'on-primary': '#ffffff',
        'on-primary-container': '#004965',
        'inverse-surface': '#213145',
        'on-secondary-fixed-variant': '#0e4b6f',
        'secondary-fixed-dim': '#9bccf6',
        'surface-tint': '#00668a',
        'error-container': '#ffdad6',
        'secondary-fixed': '#cbe6ff',
        'on-error-container': '#93000a',
        'primary-container': '#38bdf8',
        surface: '#f8f9ff'
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
        'container-max': '1440px',
        gutter: '1.5rem',
        'section-gap': '2.5rem'
      },
      fontFamily: {
        'body-lg': ['Inter', 'Noto Sans TC', 'sans-serif'],
        'body-md': ['Inter', 'Noto Sans TC', 'sans-serif'],
        'headline-md': ['Inter', 'Noto Sans TC', 'sans-serif'],
        'headline-lg': ['Inter', 'Noto Sans TC', 'sans-serif'],
        'headline-lg-mobile': ['Inter', 'Noto Sans TC', 'sans-serif'],
        'display-temp': ['Inter', 'Noto Sans TC', 'sans-serif'],
        'label-sm': ['Inter', 'Noto Sans TC', 'sans-serif']
      },
      fontSize: {
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'display-temp': ['80px', { lineHeight: '80px', letterSpacing: '-0.04em', fontWeight: '700' }],
        'label-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }]
      }
    }
  }
} satisfies Config
