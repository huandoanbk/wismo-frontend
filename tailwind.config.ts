import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        wismo: {
          primary:         '#4F7CAC',
          'primary-hover': '#3D6A9A',
          bg:              '#FAFAFA',
          'sidebar-bg':    '#F3F4F6',
          'message-user':  '#EBF3FB',
          'message-bot':   '#FFFFFF',
          text:            '#1F2937',
          'text-muted':    '#6B7280',
          'text-light':    '#9CA3AF',
          active:          '#10B981',
          resolved:        '#6B7280',
          paused:          '#F59E0B',
          crisis:          '#EF4444',
          'crisis-border': '#DC2626',
          warning:         '#F59E0B',
          border:          '#E5E7EB',
          'border-light':  '#F3F4F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
