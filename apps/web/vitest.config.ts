import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: './scripts/setup-tests.ts',
    environment: 'jsdom',
    include: ['**/*.test.tsx', '**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['html', 'lcov'],
    },
  },
  resolve: {
    alias: [{ find: '@', replacement: resolve(__dirname, './src') }],
  },
})
