import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/fuzztok/',
  root: 'demo',
  build: {
    outDir: '../demo-dist'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})