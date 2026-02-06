import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Neuro Progeny Brand Colors
        'np-blue': {
          DEFAULT: '#476B8E',
          light: '#5a7d9f',
          dark: '#3a5a7a',
          hover: 'rgba(71, 107, 142, 0.1)',
        },
        'np-teal': {
          DEFAULT: '#2A9D8F',
          light: '#3ab8a8',
          dark: '#238577',
          hover: 'rgba(42, 157, 143, 0.1)',
        },
        'np-gold': {
          DEFAULT: '#E9C46A',
          light: '#f0d58a',
          dark: '#d4af4f',
          hover: 'rgba(233, 196, 106, 0.15)',
        },
        'np-coral': {
          DEFAULT: '#F4A261',
          light: '#f7b681',
          dark: '#e8914d',
          hover: 'rgba(244, 162, 97, 0.1)',
        },
        // UI Colors
        background: '#F8F9FA',
        surface: '#FFFFFF',
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F3F4F6',
        },
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'sidebar': '2px 0 8px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}

export default config
